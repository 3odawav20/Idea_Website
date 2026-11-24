#!/usr/bin/env python3
"""Publish a tested frontend on cPanel; never replace APIs, MySQL or routing config.
Called with deploy.lock held by cpanel-safe-release.sh. Python 3.6 compatible.
"""
import os, sys, re, hashlib, shutil, tempfile, json, subprocess
from pathlib import Path
os.umask(0o077)
ROOT=Path("/home/lsenet5/idea_release_staging")
LIVE=Path("/home/lsenet5/idea-dh.com")
REPO=Path("/home/lsenet5/repositories/Idea_Website")
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()
def fetch(path):
    return subprocess.check_output(["curl","--fail","--silent","--show-error","--max-time","25","-A",UA,"-H","Cache-Control: no-cache","https://idea-dh.com"+path])
def health():
    a=json.loads(fetch("/api/accounts.php?action=health"))
    v=json.loads(fetch("/api/visualize.php?action=health"))
    if not (a.get("ok") and a.get("backend")=="php-mysql" and v.get("ok") and v.get("auth")=="IDEASESSID" and v.get("provider",{}).get("configured") and v.get("provider",{}).get("runtime_ready")):
        raise RuntimeError("Live PHP/MySQL/visualizer health gate failed")
def protected():
    paths=[LIVE/".htaccess"]+list((LIVE/"api").rglob("*"))+list((LIVE/"data").rglob("*"))
    return {str(p.relative_to(LIVE)):digest(p) for p in paths if p.is_file() and not p.is_symlink()}
def mkdir_public(p):
    if p==LIVE:return
    if p.is_symlink():raise RuntimeError("Symlink directory: "+str(p))
    if not p.exists():
        mkdir_public(p.parent)
        p.mkdir(mode=0o755)
        p.chmod(0o755)
    elif not p.is_dir():raise RuntimeError("Not directory: "+str(p))
def atomic_copy(src,dst,mode):
    mkdir_public(dst.parent)
    fd,tmp=tempfile.mkstemp(prefix=".idea-release-",dir=str(dst.parent))
    try:
        with os.fdopen(fd,"wb") as f,src.open("rb") as inp:
            shutil.copyfileobj(inp,f);f.flush();os.fsync(f.fileno())
        os.chmod(tmp,mode);os.replace(tmp,str(dst))
    finally:
        if os.path.exists(tmp):os.unlink(tmp)
def atomic_state(path,content):
    fd,tmp=tempfile.mkstemp(prefix=".idea-state-",dir=str(ROOT))
    try:
        with os.fdopen(fd,"w") as f:f.write(content);f.flush();os.fsync(f.fileno())
        os.replace(tmp,str(path))
    finally:
        if os.path.exists(tmp):os.unlink(tmp)
def main():
    sha=sys.argv[1];stage=Path(sys.argv[2]).resolve()
    if not re.fullmatch(r"[a-f0-9]{40}",sha) or stage.parent!=ROOT or not stage.name.startswith("release_"+sha[:12]+"_"):
        raise RuntimeError("Invalid staged release")
    remote=subprocess.check_output(["git","ls-remote","origin","refs/heads/main"],cwd=str(REPO),universal_newlines=True).split()[0]
    if remote!=sha:raise RuntimeError("Main advanced; do not publish stale build")
    old_index=LIVE/"index.html";html=(stage/"index.html").read_bytes()
    entries=re.findall(rb'/assets/index-[A-Za-z0-9_-]+\.(?:js|css)',html)
    if len(entries)!=2 or not any(e.endswith(b".js") for e in entries) or not any(e.endswith(b".css") for e in entries):raise RuntimeError("Unexpected Vite entrypoints")
    for e in entries:
        if not (stage/e.decode("ascii").lstrip("/")).is_file():raise RuntimeError("Missing Vite entrypoint")
    before=protected();health()
    backup=Path(tempfile.mkdtemp(prefix="auto_live_backup_"+sha[:12]+"_",dir=str(ROOT)))
    changed=[];skipped=[]
    for src in sorted(stage.rglob("*")):
        if src.is_symlink():raise RuntimeError("Unexpected staged symlink")
        if not src.is_file():continue
        rel=src.relative_to(stage)
        if rel.as_posix()=="index.html":continue
        if rel.parts[0] in ("api","data") or rel.as_posix()==".htaccess":
            skipped.append(str(rel));continue
        if not (rel.parts[0] in ("assets","media","images","fonts") or rel.as_posix() in ("robots.txt","sitemap.xml")):
            raise RuntimeError("Unreviewed public file "+str(rel))
        if any(part.startswith(".") for part in rel.parts) or src.suffix.lower() in (".php",".phtml",".phar",".cgi",".pl",".sh",".exe",".py",".htaccess"):
            raise RuntimeError("Unexpected executable "+str(rel))
        dst=LIVE/rel
        if dst.is_symlink() or any((LIVE/Path(*rel.parts[:i])).is_symlink() for i in range(1,len(rel.parts))):raise RuntimeError("Live symlink "+str(rel))
        if dst.exists() and not dst.is_file():raise RuntimeError("Collision "+str(rel))
        if dst.is_file() and digest(dst)==digest(src):continue
        if dst.is_file() and rel.parts[0]=="assets" and re.search(r'-[A-Za-z0-9_-]{8}\.(js|css)$',src.name):
            raise RuntimeError("Hashed asset collision "+str(rel))
        changed.append((rel,src,dst))
    changed.append((Path("index.html"),stage/"index.html",old_index))
    manifest=[]
    for rel,src,dst in changed:
        old=None
        if dst.exists():
            copy=backup/"original"/rel
            copy.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(str(dst),str(copy));old=digest(dst)
        manifest.append({"path":str(rel),"old":old,"new":digest(src)})
    (backup/"manifest.json").write_text(json.dumps(manifest,indent=2))
    (backup/"protected-sha256.json").write_text(json.dumps(before,indent=2))
    (backup/"release-sha").write_text(sha+"\n")
    (backup/"preserved-server-files.json").write_text(json.dumps(skipped,indent=2))
    print("IDEA_BACKUP="+str(backup),flush=True)
    installed=[]
    try:
        for rel,src,dst in changed:
            old=next(x["old"] for x in manifest if x["path"]==str(rel))
            if (digest(dst) if dst.is_file() else None)!=old:raise RuntimeError("Concurrent file change "+str(rel))
            mode=dst.stat().st_mode&0o777 if dst.exists() else 0o644
            atomic_copy(src,dst,mode);installed.append(rel)
        for m in manifest:
            if digest(LIVE/m["path"])!=m["new"]:raise RuntimeError("Published digest mismatch")
        for route in ("/","/ai-room-visualizer","/products","/product/aqua-39","/login","/business","/account","/admin","/room-designer/3d"):
            data=fetch(route+"?idea_release="+sha[:12])
            if not all(e in data for e in entries):raise RuntimeError("Live route mismatch "+route)
        for e in entries:
            if hashlib.sha256(fetch(e.decode("ascii"))).hexdigest()!=digest(stage/e.decode("ascii").lstrip("/")):raise RuntimeError("Served bundle mismatch")
        if protected()!=before:raise RuntimeError("Protected PHP/config/data changed")
        health()
        atomic_state(ROOT/"last-published-sha",sha+"\n")
        atomic_state(ROOT/"last-published-index-sha256",digest(old_index)+"\n")
        print("LIVE_RELEASE_VERIFIED=1",flush=True)
        print("PROTECTED_PHP_CONFIG_DATA_UNCHANGED=1",flush=True)
        print("LIVE_ENTRYPOINT="+",".join(e.decode("ascii") for e in entries),flush=True)
    except BaseException:
        for rel in reversed(installed):
            old=backup/"original"/rel
            if old.is_file():atomic_copy(old,LIVE/rel,old.stat().st_mode&0o777)
        print("ROLLBACK_APPLIED=1",flush=True)
        raise
if __name__=="__main__":main()
