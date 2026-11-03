<?php
declare(strict_types=1);
$lib=__DIR__.'/../server/cpanel/api/tile-dimensions.php';
if(!is_file($lib))$lib=__DIR__.'/../api/tile-dimensions.php';
require_once $lib;

function check(bool $ok,string $message):void {
  if(!$ok){fwrite(STDERR,'FAIL '.$message.PHP_EOL);exit(1);}
}
function expectInvalid(callable $fn,string $code):void {
  try{$fn();}catch(InvalidArgumentException $e){check($e->getMessage()===$code,'wrong code '.$e->getMessage());return;}
  check(false,'expected '.$code);
}
$a=ideaTileParseSize('50x150','cm');
check($a['width_mm']===500.0 && $a['height_mm']===1500.0,'Art Ceramic 50x150');
check(abs($a['aspect_ratio']-1/3)<.000001,'tile aspect ratio 1 to 3');
$b=ideaTileParseSize('60 × 120 cm');
check($b['width_mm']===600.0 && $b['height_mm']===1200.0,'60x120 cm');
$c=ideaTileParseSize('600x1200mm');
check($c['width_mm']===600.0 && $c['height_mm']===1200.0,'mm conversion');
$d=ideaTileParseSize('50 x 60', 'cm');
check($d['width_mm']===500.0 && $d['height_mm']===600.0,'Art Ceramic outdoor size');
ideaTileAssertMatches($b,'60x120',600,1200);
expectInvalid(fn()=>ideaTileAssertMatches($b,'60x60'), 'PRODUCT_TILE_SIZE_MISMATCH');
expectInvalid(fn()=>ideaTileAssertMatches($b,'60x120',600,600), 'PRODUCT_TILE_SIZE_MISMATCH');
expectInvalid(fn()=>ideaTileParseSize('60x120'), 'TILE_DIMENSIONS_UNIT_MISSING');
expectInvalid(fn()=>ideaTileParseSize('not-specified','cm'), 'TILE_DIMENSIONS_UNRECOGNIZED');
expectInvalid(fn()=>ideaTileParseSize('0x100','cm'), 'TILE_DIMENSIONS_OUT_OF_RANGE');
echo 'TILE_PHYSICAL_SIZE_TESTS_PASS 10/10'.PHP_EOL;
