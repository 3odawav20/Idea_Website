<?php
declare(strict_types=1);
function accountError(int $http,string $code): never {throw new RuntimeException($code,$http);}
function platformConfig(): array{return ['runpod_endpoint_id'=>'qwen-image-edit-2511'];}
function platformSecret(string $name): string{return $name==='RUNPOD_API_KEY'?'test-valid-server-side-runpod-key':'';}
function platformHttp(string $url,array $headers,array $body,string $method='POST',int $timeout=45): array{
 $GLOBALS['request']=['url'=>$url,'headers'=>$headers,'body'=>$body,'method'=>$method];
 return $method==='GET'?[200,['id'=>'runpod-job-12345','status'=>'IN_PROGRESS']]:[200,['id'=>'runpod-job-12345','status'=>'IN_QUEUE']];
}
require __DIR__.'/../../public/api/platform-runpod.php';
function checkIdea(bool $condition,string $message): void{if(!$condition)throw new RuntimeException($message);}
$png=base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==');
$id=platformRunpodSubmit($png,$png,'Test only. Do not send anywhere.');
checkIdea($id==='runpod-job-12345','must return Runpod provider job ID');
$q=$GLOBALS['request'];
checkIdea($q['url']==='https://api.runpod.ai/v2/qwen-image-edit-2511/run','must send to Runpod /run and not another provider');
checkIdea($q['body']['input']['images'][0]==='data:image/jpeg;base64,'.base64_encode($png),'room image first');
checkIdea(count($q['body']['input']['images'])===2,'exactly two reference images');
checkIdea(in_array('Authorization: Bearer test-valid-server-side-runpod-key',$q['headers'],true),'server-side auth header');
$s=platformRunpodStatus($id);
checkIdea($s['status']==='IN_PROGRESS','provider poll should return status');
checkIdea($GLOBALS['request']['url']==='https://api.runpod.ai/v2/qwen-image-edit-2511/status/runpod-job-12345','poll actual provider id');
try{platformRunpodStatus('https://evil.invalid/path');throw new RuntimeException('INVALID_ID_NOT_REJECTED');}
catch(RuntimeException $e){checkIdea($e->getMessage()==='RUNPOD_JOB_ID_INVALID','reject invalid job ID');}
echo "PASS: Runpod-only request, two images, server-only key, provider ID and status polling\n";