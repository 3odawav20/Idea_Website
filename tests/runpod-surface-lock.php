<?php
declare(strict_types=1);
require_once __DIR__ . '/../server/runpod/surface-lock.php';

if (!extension_loaded('gd')) {
    fwrite(STDERR, "FAIL: PHP GD is required for the surface-lock test.\n");
    exit(1);
}
function testCheck(bool $ok, string $message): void {
    if (!$ok) throw new RuntimeException('ASSERTION FAILED: ' . $message);
}
function pngBytes(\GdImage $im): string {
    ob_start();
    imagepng($im);
    $data=ob_get_clean();
    if (!is_string($data) || !$data) throw new RuntimeException('PNG encoding failed');
    return $data;
}
function rgb(\GdImage $im, int $x, int $y): int {
    return imagecolorat($im, $x, $y) & 0xffffff;
}
function expectError(callable $task, string $code): void {
    try {$task();} catch (InvalidArgumentException $e) {
        testCheck($e->getMessage() === $code, 'Expected ' . $code . ', got ' . $e->getMessage());
        return;
    }
    throw new RuntimeException('Expected ' . $code . ' rejection');
}
$width=160;$height=96;
$room=imagecreatetruecolor($width,$height);
$base=imagecolorallocate($room,36,55,74);
$furniture=imagecolorallocate($room,112,73,39);
imagefill($room,0,0,$base);
imagefilledrectangle($room,40,58,84,90,$furniture);
$roomData=pngBytes($room);
$render=imagecreatetruecolor(80,48);
$tile=imagecolorallocate($render,195,184,175);
imagefill($render,0,0,$tile);
$renderData=pngBytes($render);
$mask=imagecreatetruecolor($width,$height);
$black=imagecolorallocate($mask,0,0,0);
$white=imagecolorallocate($mask,255,255,255);
imagefill($mask,0,0,$white);
imagefilledrectangle($mask,40,58,84,90,$black); // furniture must never change
imagefilledrectangle($mask,20,10,48,35,$black); // window must never change
$maskData=pngBytes($mask);
$out=ideaSurfaceOnlyComposite($roomData,$renderData,$maskData);
$im=imagecreatefromstring($out);
testCheck($im instanceof \GdImage,'output is a PNG image');
testCheck(imagesx($im)===$width && imagesy($im)===$height,'exact original dimensions');
$changed=0;$protected=0;
for($y=0;$y<$height;$y++)for($x=0;$x<$width;$x++) {
    if(rgb($mask,$x,$y)===0x000000){
        ++$protected;
        testCheck(rgb($im,$x,$y)===rgb($room,$x,$y),"protected pixel changed at $x,$y");
    } else {
        if(rgb($im,$x,$y)!==rgb($room,$x,$y))++$changed;
    }
}
testCheck($protected>1500 && $changed>10000,'protected and editable regions exercised');
testCheck(rgb($im,50,70)===rgb($room,50,70),'furniture retained');
testCheck(rgb($im,25,25)===rgb($room,25,25),'window retained');
testCheck(rgb($im,3,3)===rgb($render,3,3),'surface modified');
// A palette-based PNG mask must be interpreted by its actual RGB colors, not palette indices.
$palette=imagecreate($width,$height);
$palBlack=imagecolorallocate($palette,0,0,0);
$palWhite=imagecolorallocate($palette,255,255,255);
imagefill($palette,0,0,$palBlack);
imagefilledrectangle($palette,1,1,90,40,$palWhite);
$paletteOut=imagecreatefromstring(ideaSurfaceOnlyComposite($roomData,$renderData,pngBytes($palette)));
testCheck(rgb($paletteOut,3,3)===rgb($render,3,3),'paletted mask allows white');
testCheck(rgb($paletteOut,100,80)===rgb($room,100,80),'paletted mask protects black');
// Fully transparent white means protected, never editable.
$alphaMask=imagecreatetruecolor($width,$height);
imagealphablending($alphaMask,false);
imagesavealpha($alphaMask,true);
$transparentWhite=imagecolorallocatealpha($alphaMask,255,255,255,127);
$solidWhite=imagecolorallocatealpha($alphaMask,255,255,255,0);
imagefill($alphaMask,0,0,$transparentWhite);
imagefilledrectangle($alphaMask,0,0,70,30,$solidWhite);
$alphaOut=imagecreatefromstring(ideaSurfaceOnlyComposite($roomData,$renderData,pngBytes($alphaMask)));
testCheck(rgb($alphaOut,3,3)===rgb($render,3,3),'opaque allowed mask works');
testCheck(rgb($alphaOut,100,80)===rgb($room,100,80),'transparent mask protects pixels');
$bad=imagecreatetruecolor(100,100);
imagefill($bad,0,0,imagecolorallocate($bad,192,192,192));
expectError(static fn()=>ideaSurfaceOnlyComposite($roomData,pngBytes($bad),$maskData),'RENDER_ASPECT_MISMATCH_RETRY_AT_ORIGINAL_DIMENSIONS');
$empty=imagecreatetruecolor($width,$height);
imagefill($empty,0,0,imagecolorallocate($empty,0,0,0));
expectError(static fn()=>ideaSurfaceOnlyComposite($roomData,$renderData,pngBytes($empty)),'SURFACE_MASK_EMPTY_OR_UNSAFE');
$wrong=imagecreatetruecolor(80,48);
imagefill($wrong,0,0,imagecolorallocate($wrong,255,255,255));
expectError(static fn()=>ideaSurfaceOnlyComposite($roomData,$renderData,pngBytes($wrong)),'MASK_DIMENSIONS_MUST_MATCH_ORIGINAL');
$prompt=ideaSurfaceOnlyPrompt('walls_and_floor',$width,$height);
testCheck(str_contains($prompt,'160 x 96')&&str_contains($prompt,'furniture'),'strong prompt includes dimensions and furniture');
echo "PASS: exact dimensions, surface edit, protected furniture/window pixels, palette PNG, transparency, unsafe masks and aspect mismatch.\n";
