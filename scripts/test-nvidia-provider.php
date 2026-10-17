<?php
declare(strict_types=1);
function fail(int $status,string $message): never {throw new RuntimeException($message,$status);}
$status=200;$calls=[];
$png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2e0sAAAAASUVORK5CYII=';
function requestJson($url,$headers,$body,$timeout=150): array {
    global $calls,$status,$png;$calls[]=['url'=>$url,'body'=>$body];
    if(str_contains($url,'chat/completions'))return [200,['choices'=>[['message'=>['content'=>'```json'."\n".json_encode(['regions'=>[[[0,0],[1,0],[1,1],[0,1]]],'exclusions'=>[],'material_description'=>'Beige stone with narrow ivory stripes'])."\n".'```']]]]];
    return [$status,$status===200?['artifacts'=>[['base64'=>$png]]]:['error'=>'Provider rejected custom image']];
}
function check(bool $value): void {if(!$value)throw new RuntimeException('Assertion failed');}
require __DIR__.'/../public/api/nvidia-provider.php';
$config=['nvidia_key'=>'dummy-test-key'];$room=['inlineData'=>['mimeType'=>'image/png','data'=>$png]];
$detected=nvidiaDetectSurfaces($config,'Segment floor',$room,$room);
check(count($calls[0]['body']['messages'][1]['content'])===3);check(count($detected['regions'])===1);
$settings=['materialType'=>'سيراميك','size'=>'30 × 90','angle'=>0,'grout'=>'#eeeeee'];
$bytes=nvidiaEditRoom($config,$room,$detected['material_description'],$settings,'floor','living room');check($bytes===base64_decode($png));check($calls[1]['body']['mode']==='i2i');check(str_ends_with($calls[1]['url'],'/flux-3-image-klein'));check(str_starts_with($calls[1]['body']['image'],'data:image/png;base64,'));check(str_contains($calls[1]['body']['prompt'],'Beige stone'));
$status=422;$rejected=false;try{nvidiaEditRoom($config,$room,'Beige stone',$settings,'floor','living room');}catch(RuntimeException $e){$rejected=$e->getCode()===422&&str_contains($e->getMessage(),'Preview');}check($rejected);
echo "PASS: NVIDIA vision receives room + swatch, FLUX receives the original room in editing mode and swatch description, returned image validated, unsupported custom images fail explicitly. Provider responses mocked; no live generation claimed.\n";
