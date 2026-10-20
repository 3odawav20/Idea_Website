<?php
// Local test fixture only. Never copy scripts/ into public_html.
$target=$argv[1]??'';if(!$target)exit(1);
if(!is_dir($target))mkdir($target,0700,true);
$db=new PDO('sqlite:'.$target.'/accounts.sqlite');$db->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);
$sql=file_get_contents(__DIR__.'/../database/mysql-accounts.sql')."\n".file_get_contents(__DIR__.'/../database/mysql-workflow-extensions.sql');
$sql=preg_replace('/\) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;/i',');',$sql);
$sql=preg_replace('/INDEX\([a-z_]+\), /i','',$sql);
$db->exec($sql);
file_put_contents($target.'/idea-accounts-config.php',"<?php return ['mysql'=>[], 'site_url'=>'http://127.0.0.1:5178', 'mail_from'=>'accounts@example.test'];");
echo "Local SQLite fixture ready. Production schema remains MySQL.\n";
