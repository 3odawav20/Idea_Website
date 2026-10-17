<?php
// Save OUTSIDE public_html as idea-accounts-config.php. Use your cPanel MySQL credentials.
return [
  'mysql' => ['host'=>'localhost','port'=>3306,'database'=>'CPANEL_DATABASE','username'=>'CPANEL_DB_USER','password'=>'YOUR_DB_PASSWORD'],
  'site_url' => 'https://your-domain.com',
  'mail_from' => 'accounts@your-domain.com',
];
