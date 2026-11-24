#!/usr/bin/env python3
"""Targeted production compatibility fix; never modifies MySQL or platform-ai.php.
Run --check first, then --apply only against the audited live source hash.
"""
import argparse
import hashlib
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

LIVE = Path("/home/lsenet5/idea-dh.com/api/visualize.php")
BACKUPS = Path("/home/lsenet5/idea_release_staging")
EXPECTED = "f3d162283de6bc02dd5d2478a5c9ba4ca9ea620a962dd5280e4fa0f9d8d272b8"
OLD = """    $file=platformAiDir($id).'/result.png';
    if(!is_file($file)||filesize($file)<100||filesize($file)>20000000){
      accountError(502,'VERIFIED_IMAGE_MISSING');
    }
    $bytes=file_get_contents($file);
    if(!is_string($bytes))accountError(502,'VERIFIED_IMAGE_UNREADABLE');
    $result['image']='data:image/png;base64,'.base64_encode($bytes);"""
NEW = """    // platformAiPollJob writes result.jpg after its verified-mask composite.
    $file=platformAiDir($id).'/result.jpg';
    if(!is_file($file)||filesize($file)<100||filesize($file)>20000000){
      accountError(502,'VERIFIED_IMAGE_MISSING');
    }
    $bytes=file_get_contents($file);
    $info=is_string($bytes)?@getimagesizefromstring($bytes):false;
    if(!$info||$info[2]!==IMAGETYPE_JPEG||$info[0]*$info[1]>10000000)
      accountError(502,'VERIFIED_IMAGE_UNREADABLE');
    // Existing live clients require PNG. Transcode the already verified JPEG;
    // do not modify the stored image, rerun generation, or bypass mask checks.
    $image=@imagecreatefromstring($bytes);
    if(!$image)accountError(502,'VERIFIED_IMAGE_UNREADABLE');
    ob_start();
    $encoded=imagepng($image,null,3);
    $png=ob_get_clean();
    imagedestroy($image);
    if(!$encoded||!is_string($png)||strlen($png)>42000000)
      accountError(502,'VERIFIED_IMAGE_EXPORT_FAILED');
    $result['image']='data:image/png;base64,'.base64_encode($png);"""

def prepare(raw):
    if hashlib.sha256(raw).hexdigest() != EXPECTED:
        raise SystemExit("Live source differs from audited version; refusing overwrite.")
    source = raw.decode("utf-8")
    if source.count(OLD) != 1:
        raise SystemExit("Expected result adapter block not found exactly once.")
    source = source.replace(OLD, NEW)
    # No watermark implementation exists in the audited platform-ai.php.
    source = source.replace("      'watermark'=>'IDEA',\n", "")
    return source.encode("utf-8")

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--apply", action="store_true")
    args = p.parse_args()
    raw = LIVE.read_bytes()
    candidate = prepare(raw)
    with tempfile.TemporaryDirectory(prefix="idea-viz-check-", dir=BACKUPS) as tmp:
        target = Path(tmp) / "visualize.php"
        target.write_bytes(candidate)
        subprocess.run(["php", "-l", str(target)], check=True)
    print("PATCH_SHA256=" + hashlib.sha256(candidate).hexdigest())
    if not args.apply:
        print("CHECK_ONLY: no live changes")
        return
    backup = Path(tempfile.mkdtemp(prefix="visualizer-backup-", dir=BACKUPS))
    shutil.copy2(LIVE, backup / LIVE.name)
    if LIVE.read_bytes() != raw:
        raise SystemExit("Live source changed after review")
    fd, tmp = tempfile.mkstemp(prefix=".idea-visualizer-", dir=LIVE.parent)
    try:
        with os.fdopen(fd, "wb") as handle:
            handle.write(candidate)
            handle.flush()
            os.fsync(handle.fileno())
        os.chmod(tmp, LIVE.stat().st_mode & 0o777)
        os.replace(tmp, LIVE)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)
    print("BACKUP=" + str(backup / LIVE.name))
    print("LIVE_PATCH_APPLIED=" + str(LIVE))
    if LIVE.read_bytes() != candidate:
        raise SystemExit("Post-write verification failed")

if __name__ == "__main__":
    main()
