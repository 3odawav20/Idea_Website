<?php
declare(strict_types=1);
if (realpath($_SERVER['SCRIPT_FILENAME']??'') === __FILE__) { http_response_code(404); exit; }

function validatePolygons(mixed $polygons, bool $allowEmpty = false): array {
    if (!is_array($polygons) || count($polygons)>32 || (!$allowEmpty && count($polygons)===0)) throw new RuntimeException('لم نستطع تحديد سطح آمن للتغيير. جرّب صورة أوضح أو التحديد اليدوي.');
    foreach($polygons as $poly) {
        if (!is_array($poly) || count($poly)<3 || count($poly)>96) throw new RuntimeException('حدود العزل غير صالحة.');
        foreach($poly as $p) if(!is_array($p)||count($p)!==2||!is_numeric($p[0])||!is_numeric($p[1])||!is_finite((float)$p[0])||!is_finite((float)$p[1])||$p[0]<0||$p[0]>1||$p[1]<0||$p[1]>1) throw new RuntimeException('حدود العزل خارج الصورة.');
    }
    return $polygons;
}

// Preserve every source pixel outside the validated surface mask. The semantic
// correctness of the detected mask must still be reviewed on actual room photos.
function compositeSurface(string $sourceBytes, string $editedBytes, array $regions, array $exclusions): array {
    validatePolygons($regions); validatePolygons($exclusions,true);
    $sourceInfo=@getimagesizefromstring($sourceBytes);$editedInfo=@getimagesizefromstring($editedBytes);
    if(!$sourceInfo||!$editedInfo||$sourceInfo[0]*$sourceInfo[1]>3000000||$editedInfo[0]*$editedInfo[1]>12000000) throw new RuntimeException('أبعاد الصورة الناتجة غير مدعومة.');
    $original=@imagecreatefromstring($sourceBytes);$edited=@imagecreatefromstring($editedBytes);
    if(!$original||!$edited)throw new RuntimeException('تعذّر فتح الصورة الناتجة.');
    imagepalettetotruecolor($original);imagepalettetotruecolor($edited);
    $w=imagesx($original);$h=imagesy($original);
    if(abs(($w/$h)/($editedInfo[0]/$editedInfo[1])-1)>.12)throw new RuntimeException('خدمة الصور غيّرت نسبة أبعاد المكان. حاول التوليد مرة أخرى.');
    $scaled=imagecreatetruecolor($w,$h);imagecopyresampled($scaled,$edited,0,0,0,0,$w,$h,imagesx($edited),imagesy($edited));imagedestroy($edited);
    $mask=imagecreatetruecolor($w,$h);$black=imagecolorallocate($mask,0,0,0);$white=imagecolorallocate($mask,255,255,255);imagefill($mask,0,0,$black);
    foreach([[$regions,$white],[$exclusions,$black]] as [$polys,$color])foreach($polys as $poly){$pts=[];foreach($poly as [$x,$y]){$pts[]=(int)round($x*($w-1));$pts[]=(int)round($y*($h-1));}imagefilledpolygon($mask,$pts,$color);}
    $changed=0;
    for($y=0;$y<$h;$y++)for($x=0;$x<$w;$x++)if((imagecolorat($mask,$x,$y)&255)>127){imagesetpixel($original,$x,$y,imagecolorat($scaled,$x,$y));$changed++;}
    if($changed<100||$changed/($w*$h)>.88)throw new RuntimeException('مساحة العزل غير موثوقة. جرّب صورة أخرى أو حدّد السطح يدويًا.');
    ob_start();imagepng($original);$bytes=ob_get_clean();ob_start();imagepng($mask);$maskBytes=ob_get_clean();
    imagedestroy($original);imagedestroy($scaled);imagedestroy($mask);
    return ['image'=>'data:image/png;base64,'.base64_encode($bytes),'mask'=>'data:image/png;base64,'.base64_encode($maskBytes),'coverage'=>round($changed/($w*$h),4)];
}
