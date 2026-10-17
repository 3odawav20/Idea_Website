<?php
declare(strict_types=1);
if(realpath($_SERVER['SCRIPT_FILENAME']??'')===__FILE__){http_response_code(404);exit;}

function nvidiaDetectSurfaces(array $config,string $prompt,array $room,array $material): array {
    $model=$config['nvidia_vision_model']??'nvidia/nemotron-nano-12b-v2-vl';
    if(!preg_match('#^[a-zA-Z0-9._/-]+$#D',$model))fail(503,'إعدادات موديل تحليل الصورة غير صالحة.');
    $parts=[['type'=>'text','text'=>$prompt.' Reference image 1 is the room. Reference image 2 is a material swatch. Also include material_description: a precise English description of ONLY the swatch color, pattern, vein shapes, texture and finish. Return only a JSON object, without markdown.']];
    foreach([$room,$material] as $image)$parts[]=['type'=>'image_url','image_url'=>['url'=>'data:'.$image['inlineData']['mimeType'].';base64,'.$image['inlineData']['data']]];
    [$code,$response]=requestJson('https://integrate.api.nvidia.com/v1/chat/completions',['Content-Type: application/json','Authorization: Bearer '.$config['nvidia_key']],['model'=>$model,'messages'=>[['role'=>'system','content'=>'/no_think'],['role'=>'user','content'=>$parts]],'temperature'=>0,'max_tokens'=>8192,'stream'=>false],90);
    if($code!==200)fail($code===429?429:502,$code===429?'وصل حساب NVIDIA لحد الاستخدام المتاح. حاول لاحقًا.':'تعذّر تحليل حدود السطح من NVIDIA. راجع تفعيل الموديل والمفتاح.');
    $text=$response['choices'][0]['message']['content']??'';
    if(!is_string($text))fail(502,'رد تحليل السطح غير صالح.');
    $text=preg_replace('/^```(?:json)?\s*|\s*```$/i','',trim($text));
    $detected=json_decode($text,true);
    if(!is_array($detected)||empty($detected['material_description'])||!is_string($detected['material_description']))fail(422,'لم يتمكن NVIDIA من تحليل السطح والخامة. جرّب صورة أوضح.');
    return $detected;
}

function nvidiaEditRoom(array $config,array $room,string $description,array $settings,string $surface,string $roomType): string {
    // NVIDIA's documented FLUX 3 endpoint accepts one reference image. The vision
    // model describes the selected swatch; FLUX receives the original room and
    // that description. This does not establish exact swatch reproduction.
    $prompt='Edit the supplied '.$roomType.' room photograph. Replace only the '.$surface.' finish with '.$settings['materialType'].' tiles, '.$settings['size'].' cm, rotated '.$settings['angle'].' degrees, narrow '.$settings['grout'].' grout. Material appearance: '.substr($description,0,1000).'. Keep furniture, fixtures, rugs, doors, windows, architecture, lighting, perspective, framing and camera position unchanged. Return only the edited room, no labels or collage.';
    $body=['mode'=>'Image Editing','prompt'=>substr($prompt,0,1990),'image'=>'data:'.$room['inlineData']['mimeType'].';base64,'.$room['inlineData']['data'],'height'=>1024,'width'=>1024,'cfg_scale'=>3.5,'samples'=>1,'seed'=>0,'steps'=>30];
    [$code,$response]=requestJson('https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.3-image-klein',['Content-Type: application/json','Accept: application/json','Authorization: Bearer '.$config['nvidia_key'],'NVCF-POLL-SECONDS: 120'],$body,150);
    if($code!==200){
        error_log('IDEA NVIDIA FLUX provider status: '.$code);
        if($code===422)fail(422,'NVIDIA رفض الصورة المرفوعة أو إعدادات التعديل. واجهة Preview الموثقة تقبل صور أمثلة جاهزة فقط؛ يلزم endpoint يدعم صور العملاء لتشغيل الميزة.');
        if($code===401||$code===403)fail(503,'مفتاح NVIDIA غير صالح أو الحساب لا يملك صلاحية استخدام FLUX 3.');
        if($code===202)fail(503,'طلب NVIDIA ما زال قيد المعالجة. لم تصل صورة نهائية خلال المهلة المتاحة.');
        fail($code===429?429:502,$code===429?'وصل حساب NVIDIA لحد الاستخدام المتاح. حاول لاحقًا.':'تعذّر توليد الصورة من NVIDIA. حاول لاحقًا.');
    }
    $encoded=$response['artifacts'][0]['base64']??$response['data'][0]['b64_json']??null;
    $bytes=is_string($encoded)?base64_decode($encoded,true):false;
    if(!$bytes||strlen($bytes)>20*1024*1024||!@getimagesizefromstring($bytes))fail(502,'لم تُرجع NVIDIA صورة صالحة. لم يتم إنشاء معاينة بديلة.');
    return $bytes;
}
