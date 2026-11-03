<?php
declare(strict_types=1);
if(!extension_loaded('gd')){fwrite(STDERR,"GD_MISSING\n");exit(2);}
function accountError(int $code,string $label):never{throw new RuntimeException($label,$code);}
$base=dirname(__DIR__).'/api';
if(!is_dir($base))$base=dirname(__DIR__).'/server/cpanel/idea-accounts-api';
require_once $base.'/platform-ai.php';
$w=256;$h=256;
$original=imagecreatetruecolor($w,$h);
for($y=0;$y<$h;$y++)for($x=0;$x<$w;$x++){
 $c=imagecolorallocate($original,50+($x%100),60+($y%100),100);
 imagesetpixel($original,$x,$y,$c);
}
ob_start();imagejpeg($original,null,95);$room=ob_get_clean();
$edited=imagecreatetruecolor($w,$h);
imagefill($edited,0,0,imagecolorallocate($edited,230,50,80));
ob_start();imagepng($edited);$new=ob_get_clean();
$mask=imagecreatetruecolor($w,$h);
imagefill($mask,0,0,imagecolorallocate($mask,0,0,0));
imagefilledrectangle($mask,70,95,140,150,imagecolorallocate($mask,255,255,255));
ob_start();imagepng($mask);$maskBytes=ob_get_clean();
$result=platformAiVerifiedMaskComposite($room,$new,$maskBytes);
if(substr($result,0,8)!=="\x89PNG\r\n\x1a\n")throw new RuntimeException('OUTPUT_NOT_PNG');
$a=imagecreatefromstring($room);$b=imagecreatefromstring($result);
$count=0;$unchanged=0;$changed=0;
for($y=0;$y<$h;$y++)for($x=0;$x<$w;$x++){
 $aRgb=imagecolorat($a,$x,$y)&0xffffff;
 $bRgb=imagecolorat($b,$x,$y)&0xffffff;
 if($x>=70&&$x<=140&&$y>=95&&$y<=150){if($aRgb!==$bRgb)$changed++;}
 else{$count++;if($aRgb===$bRgb)$unchanged++;}
}
if($changed<3000||$unchanged!==$count)throw new RuntimeException('PRESERVATION_MISMATCH '.$changed.' '.$unchanged.' '.$count);
$points=[[0.22,0.30],[0.65,0.30],[0.65,0.75],[0.22,0.75]];
$result2=platformAiComposite($room,$result,$points);
$c=imagecreatefromstring($result2);
for($y=0;$y<$h;$y++)for($x=0;$x<$w;$x++){
 if($x>=70&&$x<=140&&$y>=95&&$y<=150)continue;
 if((imagecolorat($a,$x,$y)&0xffffff)!==(imagecolorat($c,$x,$y)&0xffffff))
  throw new RuntimeException('SECOND_PASS_OUTSIDE_CHANGED');
}
echo "LOSSLESS_PIXEL_PRESERVATION_PASS unchanged=$unchanged/$count edited=$changed\n";
