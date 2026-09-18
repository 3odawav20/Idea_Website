<?php
return [
    'db' => [
        'dsn' => 'mysql:host=localhost;dbname=CPANEL_DB;charset=utf8mb4',
        'user' => 'CPANEL_DB_USER',
        'pass' => 'CHANGE_ME',
    ],
    'api' => [
        'cors_origins' => [
            'https://idea-website-two.vercel.app',
        ],
        'write_token' => 'CHANGE_ME',
    ],
    'media' => [
        'directory' => __DIR__ . '/public/media',
        'public_base' => 'https://YOUR_DOMAIN/catalog-media',
    ],
    'sources' => [
        'mazloum' => [
            'enabled' => true,
            'listing_url' => 'https://mazloumhome.com/2-home',
            'fallback_listing_url' => 'https://mazloumhome.com/new-products',
            'max_pages' => 100,
            'request_timeout_seconds' => 30,
        ],
    ],
];
