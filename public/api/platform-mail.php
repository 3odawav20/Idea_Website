<?php
declare(strict_types=1);
if(realpath($_SERVER['SCRIPT_FILENAME']??'')===__FILE__){http_response_code(404);exit;}
function platformMailReady(): bool{$s=platformConfig()['smtp']??[];return !empty($s['host'])&&!empty($s['username'])&&filter_var($s['from_email']??'',FILTER_VALIDATE_EMAIL)&&platformSecret('SMTP_PASSWORD')!=='';}
function platformQueueMail(?string $uid,string $recipient,string $event,string $subject,string $body): void{
 if(!filter_var($recipient,FILTER_VALIDATE_EMAIL)||preg_match('/[\r\n]/',$subject))accountError(422,'INVALID_MAIL');
 if(accountQuery('SELECT id FROM idea_mail_outbox WHERE event_key=?',[$event])->fetch())return;
 accountQuery('INSERT INTO idea_mail_outbox(id,user_id,event_key,recipient,subject,body,status,next_attempt_at,created_at) VALUES(?,?,?,?,?,?,?,?,?)',[platformId(),$uid,$event,$recipient,$subject,$body,'queued',platformNow(),platformNow()]);
}
function platformSmtpSend(string $recipient,string $subject,string $body): void{
 if(!platformMailReady())accountError(503,'SMTP_NOT_CONFIGURED');$s=platformConfig()['smtp'];$host=$s['host'];$port=(int)($s['port']??465);$tls=$s['encryption']??'ssl';
 if(!preg_match('/^[a-zA-Z0-9.-]+$/D',$host)||!in_array($port,[465,587],true)||!in_array($tls,['ssl','starttls'],true))accountError(503,'INVALID_SMTP_CONFIG');
 $context=stream_context_create(['ssl'=>['verify_peer'=>true,'verify_peer_name'=>true,'peer_name'=>$host,'allow_self_signed'=>false]]);
 $socket=stream_socket_client(($tls==='ssl'?'ssl://':'tcp://').$host.':'.$port,$errno,$error,15,STREAM_CLIENT_CONNECT,$context);if(!$socket)throw new RuntimeException('SMTP_CONNECTION_FAILED');stream_set_timeout($socket,15);
 $read=function(array $expected)use($socket){$last='';do{$line=fgets($socket,2048);if($line===false)throw new RuntimeException('SMTP_TIMEOUT');$last=$line;}while(isset($line[3])&&$line[3]==='-');if(!in_array((int)substr($last,0,3),$expected,true))throw new RuntimeException('SMTP_REJECTED_'.substr($last,0,3));};
 $send=function(string $line,array $expected)use($socket,$read){if(fwrite($socket,$line."\r\n")===false)throw new RuntimeException('SMTP_WRITE_FAILED');$read($expected);};
 try{$read([220]);$send('EHLO idea.local',[250]);if($tls==='starttls'){$send('STARTTLS',[220]);if(!stream_socket_enable_crypto($socket,true,STREAM_CRYPTO_METHOD_TLS_CLIENT))throw new RuntimeException('SMTP_TLS_FAILED');$send('EHLO idea.local',[250]);}
  $send('AUTH LOGIN',[334]);$send(base64_encode($s['username']),[334]);$send(base64_encode(platformSecret('SMTP_PASSWORD')),[235]);$send('MAIL FROM:<'.$s['from_email'].'>',[250]);$send('RCPT TO:<'.$recipient.'>',[250,251]);$send('DATA',[354]);
  $name='=?UTF-8?B?'.base64_encode($s['from_name']??'IDEA').'?=';$headers=['From: '.$name.' <'.$s['from_email'].'>','To: <'.$recipient.'>','Subject: =?UTF-8?B?'.base64_encode($subject).'?=','Date: '.date(DATE_RFC2822),'Message-ID: <'.bin2hex(random_bytes(16)).'@'.substr(strrchr($s['from_email'],'@'),1).'>','MIME-Version: 1.0','Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64'];
  $message=implode("\r\n",$headers)."\r\n\r\n".chunk_split(base64_encode($body),76,"\r\n");$send($message."\r\n.",[250]);$send('QUIT',[221]);
 }finally{fclose($socket);}
}
function platformFlushMail(int $limit=10): array{
 if(!platformMailReady())accountError(503,'SMTP_NOT_CONFIGURED');$sent=0;$failed=0;
 for($i=0;$i<$limit;$i++){
  $mail=platformTransaction(function(){accountQuery("UPDATE idea_mail_outbox SET status='queued' WHERE status='sending' AND next_attempt_at<?",[platformNow()-300000]);$r=accountQuery("SELECT * FROM idea_mail_outbox WHERE status IN ('queued','retry') AND next_attempt_at<=? AND attempts<5 ORDER BY created_at LIMIT 1".platformLock(),[platformNow()])->fetch();if(!$r)return null;accountQuery("UPDATE idea_mail_outbox SET status='sending',attempts=attempts+1,next_attempt_at=? WHERE id=?",[platformNow(),$r['id']]);return $r;});
  if(!$mail)break;
  try{platformSmtpSend($mail['recipient'],$mail['subject'],$mail['body']);accountQuery("UPDATE idea_mail_outbox SET status='sent',sent_at=?,last_error='' WHERE id=?",[platformNow(),$mail['id']]);$sent++;}
  catch(Throwable $e){$attempt=(int)$mail['attempts']+1;accountQuery('UPDATE idea_mail_outbox SET status=?,next_attempt_at=?,last_error=? WHERE id=?',[$attempt>=5?'failed':'retry',platformNow()+min(3600000,60000*(2**$attempt)),'SMTP delivery failed; inspect server configuration.',$mail['id']]);$failed++;}
 }return ['sent'=>$sent,'failed'=>$failed];
}
function platformVerificationToken(array $u): void{
 accountQuery("DELETE FROM idea_email_tokens WHERE user_id=? AND purpose='verify'",[$u['id']]);$token=bin2hex(random_bytes(32));accountQuery('INSERT INTO idea_email_tokens(token_hash,user_id,purpose,expires_at) VALUES(?,?,?,?)',[hash('sha256',$token),$u['id'],'verify',time()+86400]);$site=rtrim(accountConfig()['site_url']??'','/');if(!preg_match('#^https?://#',$site))accountError(503,'SITE_URL_REQUIRED');
 platformQueueMail($u['id'],$u['email'],'verify:'.hash('sha256',$token),'IDEA — Verify your email / تأكيد البريد الإلكتروني',"Confirm your IDEA email within 24 hours / أكّد بريدك خلال ٢٤ ساعة:\n".$site.'/verify-email?token='.$token);
}
