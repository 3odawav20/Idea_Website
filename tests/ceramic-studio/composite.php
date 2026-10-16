<?php
declare(strict_types=1);
require __DIR__.'/../../public/api/image-tools.php';
function pngBytes($image): string {ob_start();imagepng($image);return ob_get_clean();}
$source=imagecreatetruecolor(100,100);$edited=imagecreatetruecolor(100,100);
imagefill($source,0,0,imagecolorallocate($source,20,90,50));imagefill($edited,0,0,imagecolorallocate($edited,220,130,60));
$regions=[[[.1,.1],[.8,.1],[.8,.8],[.1,.8]]];$exclude=[[[.4,.4],[.6,.4],[.6,.6],[.4,.6]]];
$out=compositeSurface(pngBytes($source),pngBytes($edited),$regions,$exclude);
$final=imagecreatefromstring(base64_decode(explode(',',$out['image'],2)[1]));$mask=imagecreatefromstring(base64_decode(explode(',',$out['mask'],2)[1]));
$outside=0;$inside=0;
for($y=0;$y<100;$y++)for($x=0;$x<100;$x++){
    if((imagecolorat($mask,$x,$y)&255)<128){if(imagecolorat($final,$x,$y)!==imagecolorat($source,$x,$y))throw new RuntimeException('Original pixels changed outside mask');$outside++;}
    else {if(imagecolorat($final,$x,$y)!==imagecolorat($edited,$x,$y))throw new RuntimeException('Material missing inside mask');$inside++;}
}
if(imagecolorat($final,50,50)!==imagecolorat($source,50,50))throw new RuntimeException('Excluded fixture changed');
if($inside===0||$outside===0)throw new RuntimeException('Trivial mask');
$rejected=false;try{validatePolygons([[[0,0],[2,0],[1,1]]]);}catch(RuntimeException $e){$rejected=true;}if(!$rejected)throw new RuntimeException('Out-of-bounds polygon accepted');
echo "PASS: $outside protected pixels unchanged; $inside material pixels replaced; fixture exclusion and invalid coordinates verified.\n";
