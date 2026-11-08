<?php
declare(strict_types=1);
$_SERVER['SCRIPT_FILENAME']=__FILE__;
$base=dirname(__DIR__).'/api';
if(!is_dir($base))$base=dirname(__DIR__).'/server/cpanel/api';
require_once $base.'/platform-core.php';
require_once $base.'/tile-dimensions.php';
foreach(['28'=>[500,1500],'48'=>[600,1200]] as $id=>$expected) {
 $spec=ideaTileCataloguedVariant((string)$id);
 if((int)$spec['width_mm']!==$expected[0]||(int)$spec['height_mm']!==$expected[1])
  throw new RuntimeException('CATALOGUE_SIZE_MISMATCH_'.$id);
 try{ideaTileAssertMatches($spec,'60x60 cm');throw new RuntimeException('SPOOF_NOT_BLOCKED');}
 catch(InvalidArgumentException $e){}
 echo 'CATALOGUE_SIZE_PASS '.$id.' '.$spec['size_label'].PHP_EOL;
}
