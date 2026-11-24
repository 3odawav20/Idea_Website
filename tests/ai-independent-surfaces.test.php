<?php
declare(strict_types=1);
require __DIR__.'/../server/cpanel/idea-accounts-api/platform-ai-surfaces.php';

function accountError(int $status, string $code): never
{
    throw new RuntimeException($code, $status);
}
function check(bool $condition, string $message): void
{
    if (!$condition) throw new RuntimeException($message);
}

$workspace = $argv[1] ?? sys_get_temp_dir();
$directory = $workspace.'/idea-surface-test-'.bin2hex(random_bytes(5));
check(mkdir($directory, 0700), 'Could not create a fixture directory.');
try {
    $size = 256;
    $base = imagecreatetruecolor($size, $size);
    imagefilledrectangle($base, 0, 0, 255, 255, 0x634321);
    imagefilledrectangle($base, 64, 57, 115, 205, 0x728f3e);
    imagepng($base, $directory.'/source');

    $wallMask = imagecreate($size, $size);
    imagecolorallocate($wallMask, 0, 0, 0);
    $white = imagecolorallocate($wallMask, 255, 255, 255);
    imagefilledrectangle($wallMask, 5, 12, 250, 135, $white);
    imagefilledrectangle($wallMask, 64, 57, 115, 135, 0);
    imagepng($wallMask, $directory.'/walls-provider-mask');
    $floorMask = imagecreatetruecolor($size, $size);
    imagefilledrectangle($floorMask, 5, 133, 250, 251, 0xffffff);
    imagefilledrectangle($floorMask, 64, 133, 115, 205, 0);
    imagepng($floorMask, $directory.'/floor-provider-mask');

    $edit = imagecreatetruecolor($size, $size);
    imagefill($edit, 0, 0, 0xdef2f0);
    imagepng($edit, $directory.'/walls-provider-image');
    imagefill($edit, 0, 0, 0x202325);
    imagepng($edit, $directory.'/floor-provider-image');

    $widthBound = 215 / 255;
    platformAiComposeSurfaces($directory, ['width'=>$size, 'height'=>$size, 'materials'=>[
        'walls'=>['area'=>[[0,0],[$widthBound,0],[$widthBound,1],[0,1]]],
        'floor'=>['area'=>[]],
    ]]);
    $rendered = imagecreatefrompng($directory.'/result.png');
    $overlay = imagecreatefrompng($directory.'/surface-mask.png');
    check(imagecolorat($rendered, 15, 35) === 0xdef2f0, 'Wall tile differs.');
    check(imagecolorat($rendered, 15, 205) === 0x202325, 'Floor tile differs.');
    check(imagecolorat($rendered, 14, 134) === imagecolorat($base, 14, 134), 'Ambiguous boundary was edited.');
    check(imagecolorat($rendered, 220, 55) === imagecolorat($base, 220, 55), 'A pixel outside the user outline changed.');
    $protected = 0;
    for ($y=0; $y<$size; $y++) {
        for ($x=0; $x<$size; $x++) {
            if ((imagecolorat($overlay, $x, $y) >> 24) === 127) {
                $protected++;
                check(imagecolorat($rendered, $x, $y) === imagecolorat($base, $x, $y), 'Protected RGB changed.');
            }
        }
    }
    check($protected > 9000, 'Fixture had too few protected pixels.');
    echo "Independent surfaces, ambiguous overlap, user outline and {$protected} protected pixels passed.\n";
} finally {
    foreach (glob($directory.'/*') as $file) unlink($file);
    rmdir($directory);
}

