<?php
// Save outside public_html. Environment variables take precedence over secrets below.
return [
 'smtp'=>['host'=>'','port'=>465,'encryption'=>'ssl','username'=>'','from_email'=>'','from_name'=>'IDEA'],
 'SMTP_PASSWORD'=>'',
 'GEMINI_API_KEY'=>'', 'gemini_model'=>'gemini-3.1-flash-image',
 'ai_daily_user_limit'=>20,'ai_daily_global_limit'=>100,
 'PAYMOB_SECRET_KEY'=>'','PAYMOB_PUBLIC_KEY'=>'','PAYMOB_HMAC_SECRET'=>'','paymob_integration_ids'=>[],
 'payment_mode'=>'sandbox', // Set live only after merchant approval and a real acceptance test.
 'BOSTA_API_KEY'=>'','bosta_pickup_address_id'=>'','bosta_webhook_secret'=>'',
 'document_scanner'=>[], // Absolute executable and fixed args, e.g. clamscan --no-summary. No shell is invoked.
 'document_requirements'=>['commercial_registration','tax_card'],
];
