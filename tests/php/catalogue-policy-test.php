<?php
declare(strict_types=1);
$_SERVER['SCRIPT_FILENAME']=__FILE__;
require_once __DIR__.'/../../public/api/catalogue-policy.php';
function checkIdea(bool $ok,string $msg): void {if(!$ok)throw new RuntimeException($msg);}
function accountQuery(string $sql,array $params=[]): object {
 $GLOBALS['last_sql']=$sql;$GLOBALS['last_params']=$params;
 return new class($GLOBALS['rows']??[]) {
  public function __construct(private array $rows){}
  public function fetchAll(): array {return $this->rows;}
 };
}
checkIdea(ideaDimensionsMatch('60x120','120 × 60 cm'),'dimension orientation');
checkIdea(!ideaDimensionsMatch('60x120','60x60'),'wrong dimensions');
checkIdea(!ideaDimensionsMatch('unknown','60x120'),'invalid dimension');
$index=ideaCatalogueIndex();checkIdea(isset($index['95']),'catalogue record 95');
$spec=['dimensions'=>$index['95']['size'],'manufacturer_name'=>'Test Factory','manufacturer_model'=>'Test Model',
 'manufacturer_evidence'=>'Private fixture','manufacturer_verified_by'=>str_repeat('a',32),'manufacturer_verified_at'=>100];
$row=['active'=>1,'catalog_product_id'=>'95','company_id'=>str_repeat('b',32),
 'specifications'=>json_encode($spec,JSON_UNESCAPED_UNICODE)];
checkIdea(ideaReviewedProduct($row),'verified item');
checkIdea(!ideaReviewedProduct(array_merge($row,['active'=>0])),'inactive must fail');
checkIdea(!ideaReviewedProduct(array_merge($row,['catalog_product_id'=>'bogus'])),'unknown must fail');
$bad=$row;$bad['company_id']=str_repeat('c',32);$badSpec=$spec;$badSpec['manufacturer_verified_by']='';$bad['specifications']=json_encode($badSpec);
checkIdea(!ideaReviewedProduct($bad),'unverified maker must fail');
$safe=ideaPublicProductSpecs($row);
checkIdea(!isset($safe['manufacturer_evidence'],$safe['manufacturer_verified_by'],$safe['manufacturer_verified_at']),'private audit must be stripped');
$GLOBALS['rows']=[$row,$bad,$row];$ids=ideaEligibleSupplierIds('key');
checkIdea($ids===[$row['company_id']],'verified matching supplier and deduplication');
checkIdea(($GLOBALS['last_params']??[])===['key'],'parameterized key');
$sql=$GLOBALS['last_sql']??'';
checkIdea(str_contains($sql,"m.status='active'")&&str_contains($sql,"c.status='verified'")&&str_contains($sql,"p.catalog_product_id<>''"),'active verified exact ID SQL');
echo "PASS catalogue-policy PHP fixtures\n";