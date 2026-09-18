<?php
declare(strict_types=1);

function ideaCatalogConfig(): array {
    $localFile = __DIR__ . '/config.local.php';
    $local = is_file($localFile) ? require $localFile : [];
    if (!is_array($local)) $local = [];

    return [
        'db_dsn' => $local['db_dsn'] ?? (getenv('IDEA_DB_DSN') ?: ''),
        'db_user' => $local['db_user'] ?? (getenv('IDEA_DB_USER') ?: ''),
        'db_password' => $local['db_password'] ?? (getenv('IDEA_DB_PASSWORD') ?: ''),
        'cors_origin' => $local['cors_origin'] ?? (getenv('IDEA_CORS_ORIGIN') ?: 'https://idea-website-two.vercel.app'),
        'media_dir' => $local['media_dir'] ?? (getenv('IDEA_MEDIA_DIR') ?: (__DIR__ . '/media')),
        'media_public_base' => $local['media_public_base'] ?? (getenv('IDEA_MEDIA_PUBLIC_BASE') ?: ''),
        'detail_batch' => (int)($local['detail_batch'] ?? (getenv('IDEA_DETAIL_BATCH') ?: 60)),
        'listing_api' => $local['listing_api'] ?? (getenv('IDEA_SOURCE_LISTING_API') ?: 'https://idea-website-two.vercel.app/api/mazloum'),
        'detail_api' => $local['detail_api'] ?? (getenv('IDEA_SOURCE_DETAIL_API') ?: 'https://idea-website-two.vercel.app/api/mazloum-detail?url='),
    ];
}
