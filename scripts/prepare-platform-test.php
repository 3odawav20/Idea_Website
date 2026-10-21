<?php
if(PHP_SAPI!=='cli')exit(1);
$dir=realpath(__DIR__.'/../artifacts/php-platform-test');if(!$dir)exit(1);$db=new PDO('sqlite:'.$dir.'/accounts.sqlite');$db->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);$db->exec('PRAGMA foreign_keys=ON');
$sql=file_get_contents(__DIR__.'/../database/mysql-platform.sql');$sql=preg_replace('/\) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;/i',');',$sql);$sql=preg_replace('/INDEX\([a-z_,]+\), /i','',$sql);$db->exec($sql);$db->exec($sql);
if(($argv[1]??'')==='promote'){$s=$db->prepare("UPDATE idea_users SET role='admin' WHERE email=?");$s->execute([$argv[2]]);}
if(($argv[1]??'')==='verify'){$u=$db->prepare('SELECT id FROM idea_users WHERE email=?');$u->execute([$argv[2]]);$id=$u->fetchColumn();$db->prepare('INSERT OR REPLACE INTO idea_user_security(user_id,email_verified_at,notification_preferences) VALUES(?,?,?)')->execute([$id,1,'{}']);}
if(($argv[1]??'')==='token'){$u=$db->prepare('SELECT id FROM idea_users WHERE email=?');$u->execute([$argv[2]]);$id=$u->fetchColumn();$token=bin2hex(random_bytes(32));$db->prepare('INSERT INTO idea_email_tokens(token_hash,user_id,purpose,expires_at) VALUES(?,?,?,?)')->execute([hash('sha256',$token),$id,'verify',time()+600]);echo $token;exit;}
file_put_contents($dir.'/idea-platform-config.php',"<?php return ['GEMINI_API_KEY'=>'fixture-key-not-a-real-provider-key','gemini_model'=>'gemini-3.1-flash-image','PAYMOB_SECRET_KEY'=>'sk_test_fixture','PAYMOB_PUBLIC_KEY'=>'pk_test_fixture','PAYMOB_HMAC_SECRET'=>'local-contract-fixture-secret','paymob_integration_ids'=>[123],'gemini_user_daily_limit'=>3,'ai_daily_customer_limit'=>2,'ai_daily_company_limit'=>2,'ai_daily_admin_limit'=>2];");
echo "PLATFORM_TEST_SCHEMA_OK\n";
