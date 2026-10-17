<?php
// Copy OUTSIDE public_html as ceramic-studio-config.php. Never ship real secrets.
return [
    'gemini_key' => 'YOUR_SERVER_SIDE_GEMINI_API_KEY',
    'model' => 'gemini-2.5-flash-image',
    'vision_model' => 'gemini-2.5-flash',
    // Accounts are verified using the PHP session and idea-accounts-config.php (MySQL).
    'daily_user_limit' => 10,
    'daily_ip_limit' => 20,
    'daily_global_limit' => 100,
];
