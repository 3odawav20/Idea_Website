#!/usr/bin/env python3
"""Narrow, owner-authorized hero source hotfix for the audited live bundle.
Does not deploy a new app build or change PHP, MySQL, CSS, or media.
"""
import argparse, hashlib, os, re, shutil, subprocess, tempfile, fcntl, json
from pathlib import Path

LIVE = Path("/home/lsenet5/idea-dh.com")
ROOT = Path("/home/lsenet5/idea_release_staging")
NODE = "/opt/alt/alt-nodejs22/root/usr/bin/node"
OLD_JS = "assets/index-DWnPh-mK.js"
EXPECTED = {"index.html": "d10985b22803eb42de95029a11e6192783c5147526445df79378d6e9843cc31f",
            OLD_JS: "5e6fe5a8b587c2c2aabad8ab07b3b9339e4269df724d1bfb41f48b7693b47963"}
MEDIA = {"idea-dark-desktop.mp4": "348b25ac5f92b55e60c4ca8129f25b6cc240175c",
         "idea-dark-mobile.mp4": "255cb6b9d672d94daf23db352bee201241f41835",
         "idea-owner-20261112.mp4": "c7ac156a49440f8da3365e5b3300053e3b3deb59",
         "idea-owner-20261112-mobile.mp4": "c7ac156a49440f8da3365e5b3300053e3b3deb59"}
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
def sha(b): return hashlib.sha256(b).hexdigest()
def atomic(path, data, mode):
    fd, tmp = tempfile.mkstemp(prefix=".hero-fix-", dir=path.parent)
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(data)
            f.flush()
            os.fsync(f.fileno())
        os.chmod(tmp, mode)
        os.replace(tmp,path)
    finally:
        if os.path.exists(tmp): os.unlink(tmp)
def fetch(path):
    return subprocess.check_output(["curl","--fail","--silent","--show-error","--max-time","25","-A",UA,"-H","Cache-Control: no-cache","https://idea-dh.com"+path])
def main():
    p=argparse.ArgumentParser()
    p.add_argument("--apply",action="store_true")
    args=p.parse_args()
    with (ROOT/"deploy.lock").open("a") as lock:
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        raw={name:(LIVE/name).read_bytes() for name in EXPECTED}
        for name, data in raw.items():
            if sha(data)!=EXPECTED[name]: raise SystemExit("Live source changed: "+name)
        for name, expected in MEDIA.items():
            path=LIVE/"media/hero"/name
            if subprocess.check_output(["git","hash-object",str(path)],text=True).strip()!=expected:
                raise SystemExit("Media differs from approved GitHub asset: "+name)
        js=raw[OLD_JS]
        # Require the two old video URLs in the same object immediately before
        # the dark poster. Never change the separate light source object.
        pattern=rb'(["\x27]/media/hero/idea-owner-20261112\.mp4["\x27]\s*,\s*(?:mobile|"mobile"|[\x27]mobile[\x27])\s*:\s*["\x27]/media/hero/idea-owner-20261112-mobile\.mp4["\x27])(?=\s*,\s*(?:poster|"poster"|[\x27]poster[\x27])\s*:\s*["\x27]/media/hero/idea-dark-porcelain\.webp)'
        matches=list(re.finditer(pattern,js))
        if len(matches)!=1: raise SystemExit("Dark-only source object not uniquely found; no live changes.")
        def replace(m):
            return m.group(0).replace(b"idea-owner-20261112-mobile.mp4",b"idea-dark-mobile.mp4").replace(b"idea-owner-20261112.mp4",b"idea-dark-desktop.mp4")
        new=re.sub(pattern,replace,js)
        for x in [b"idea-dark-desktop.mp4",b"idea-dark-mobile.mp4",b"idea-owner-20261112.mp4",b"idea-owner-20261112-mobile.mp4"]:
            if new.count(x)!=1: raise SystemExit("Unexpected source count: "+str(x))
        target="assets/index-hero-"+sha(new)[:16]+".js"
        old_html=raw["index.html"]
        if old_html.count(OLD_JS.encode())!=1: raise SystemExit("Entrypoint mismatch")
        html=old_html.replace(OLD_JS.encode(),target.encode())
        with tempfile.TemporaryDirectory(prefix="hero-qa-",dir=ROOT) as tmp:
            check=Path(tmp)/"candidate.mjs"
            check.write_bytes(new)
            subprocess.run([NODE,"--check",str(check)],check=True)
        print("NEW_BUNDLE="+target,flush=True)
        print("LIGHT_AND_DARK_SOURCE_CHECK=PASS",flush=True)
        if not args.apply:
            print("CHECK_ONLY=1",flush=True)
            return
        health=json.loads(fetch("/api/accounts.php?action=health"))
        if not health.get("ok") or health.get("backend")!="php-mysql": raise SystemExit("Health gate failed")
        backup=Path(tempfile.mkdtemp(prefix="hero-live-backup-",dir=ROOT))
        shutil.copy2(LIVE/"index.html",backup/"index.html")
        print("BACKUP="+str(backup),flush=True)
        dest=LIVE/target
        if dest.exists() and dest.read_bytes()!=new: raise SystemExit("Asset collision")
        if not dest.exists(): atomic(dest,new,0o644)
        if (LIVE/"index.html").read_bytes()!=old_html: raise SystemExit("Concurrent index change")
        mode=(LIVE/"index.html").stat().st_mode&0o777
        try:
            atomic(LIVE/"index.html",html,mode)
            for route in ("/","/business","/account","/admin","/login"):
                response=fetch(route+"?hero_release="+sha(new)[:16])
                if target.encode() not in response: raise RuntimeError("Live route failed: "+route)
            if sha(fetch("/"+target))!=sha(new): raise RuntimeError("Served JS hash mismatch")
            health=json.loads(fetch("/api/accounts.php?action=health"))
            if not health.get("ok") or health.get("backend")!="php-mysql": raise RuntimeError("Health gate failed after release")
        except BaseException:
            atomic(LIVE/"index.html",old_html,mode)
            print("ROLLED_BACK_INDEX=1",flush=True)
            raise
        print("LIVE_HERO_PATCH_VERIFIED=1",flush=True)
if __name__=="__main__": main()
