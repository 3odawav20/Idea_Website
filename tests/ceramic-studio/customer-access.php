<?php
declare(strict_types=1);
require __DIR__.'/../../public/api/customer-access.php';
$cases=[['buyer',[],true],['supplier',[],false],['admin',[],false],['buyer',[['company_id'=>'company-1']],false],['designer',[],false],['contractor',[],false],[null,[],false]];
foreach($cases as [$role,$companies,$expected])if(customerMayGenerate([['role'=>$role]],$companies)!==$expected)throw new RuntimeException('Role gate failed: '.($role??'missing'));
if(customerMayGenerate([],[]) || customerMayGenerate(null,[]) || customerMayGenerate([['role'=>'buyer']],null))throw new RuntimeException('Invalid permission data accepted');
echo "PASS: customer-only generation; suppliers, admins, company members, other roles and missing/invalid roles denied.\n";
