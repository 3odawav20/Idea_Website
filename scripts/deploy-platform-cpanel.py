"""Run from the extracted private release directory on the authorized cPanel host."""
from pathlib import Path
import subprocess, os, shutil, zipfile, json, time, hashlib

HOME=Path('/home/lsenet5')
ROOT=HOME/'public_html'
STAGE=Path(__file__).resolve().parent.parent
assert ROOT.resolve()==Path('/home/lsenet5/public_html') and ROOT.is_dir()
assert str(STAGE).startswith('/home/lsenet5/idea-platform-release-')
manifest=json.loads((STAGE/'release.json').read_text())
files=[]
for rel,digest in manifest['files'].items():
    path=Path(rel)
    assert not path.is_absolute() and '..' not in path.parts
    source=STAGE/'site'/path
    assert hashlib.sha256(source.read_bytes()).hexdigest()==digest
    files.append((path,source))
assert not any(path.parts[0]=='api' or path.name=='.htaccess' and len(path.parts)==1 for path,_ in files)
backup=HOME/'idea-deploy-backups'/('platform-'+str(int(time.time())))
backup.mkdir(mode=0o700,parents=True)
backup_php=STAGE/'backup-database.php'
backup_php.write_text("""<?php
$c=require '/home/lsenet5/idea-accounts-config.php';$m=$c['mysql'];
if($m['database']!=='lsenet5_idealive18')throw new Exception('Unexpected database');
$env=getenv();$env['MYSQL_PWD']=$m['password'];
$cmd=['mysqldump','--single-transaction','--skip-lock-tables','--no-tablespaces','-h',$m['host']??'localhost','-u',$m['username'],$m['database']];
$p=proc_open($cmd,[0=>['pipe','r'],1=>['file',$argv[1].'/database.sql','w'],2=>['file',$argv[1].'/database.log','w']],$pipes,null,$env);fclose($pipes[0]);$code=proc_close($p);if($code!==0||filesize($argv[1].'/database.sql')<100)throw new Exception('Database backup failed');chmod($argv[1].'/database.sql',0600);echo 'DATABASE_BACKUP_OK';
""")
subprocess.run(['php',str(backup_php),str(backup)],check=True)
with zipfile.ZipFile(backup/'files.zip','w',zipfile.ZIP_DEFLATED) as archive:
    for rel,source in files:
        target=ROOT/rel
        assert ROOT.resolve() in target.resolve().parents
        if target.is_file():archive.write(target,str(rel))
with zipfile.ZipFile(backup/'files.zip') as archive:assert archive.testzip() is None
shutil.copy2(HOME/'idea-accounts-config.php',backup/'idea-accounts-config.php')
private=HOME/'idea-platform-config.php'
if private.exists():shutil.copy2(private,backup/'idea-platform-config.php')
else:
    cfg=(STAGE/'idea-platform-config.example.php').read_text()
    cfg=cfg.replace("'document_scanner'=>[]", "'document_scanner'=>['/bin/clamscan','--no-summary','--max-filesize=6M','--database=/home/lsenet5/idea-platform-private/clamav']")
    private.write_text(cfg)
    private.chmod(0o600)
env=os.environ.copy();env['IDEA_ACCOUNTS_CONFIG']=str(HOME/'idea-accounts-config.php')
subprocess.run(['php',str(STAGE/'scripts/migrate-platform.php')],check=True,env=env)
for _,source in files:
    if source.suffix=='.php':subprocess.run(['php','-l',str(source)],check=True,stdout=subprocess.DEVNULL)
try:
    for rel,source in sorted(files,key=lambda pair:pair[0].name=='index.html'):
        target=ROOT/rel;target.parent.mkdir(parents=True,exist_ok=True)
        temp=target.with_name(target.name+'.idea-new');shutil.copyfile(source,temp);os.replace(temp,target)
    # The host WAF rejects loopback HTTP requests (406). Verify DB/module health
    # here; the release remains pending a separate authenticated browser check.
    verify=STAGE/'verify-installed.php'
    verify.write_text("""<?php
$_SERVER['DOCUMENT_ROOT']='/home/lsenet5/public_html';
require '/home/lsenet5/public_html/idea-accounts-api/platform-core.php';
require '/home/lsenet5/public_html/idea-accounts-api/platform-mail.php';
accountQuery('SELECT id FROM idea_users LIMIT 1');
accountQuery('SELECT version FROM idea_schema_versions LIMIT 1');
echo json_encode(platformFeatures());
""")
    features=json.loads(subprocess.check_output(['php',str(verify)],env=env))
    assert 'gemini' in features

except Exception:
    with zipfile.ZipFile(backup/'files.zip') as archive:archive.extractall(ROOT)
    raise
receipt={'domain':'livefree.support','commit':manifest['commit'],'backup':str(backup),'files':len(files),'mysql_migration':True,'features':features,'external_browser_verification':'pending'}
(STAGE/'deployment-receipt.json').write_text(json.dumps(receipt,indent=2))
print(json.dumps(receipt),flush=True)
