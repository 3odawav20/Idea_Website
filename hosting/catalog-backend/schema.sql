CREATE TABLE IF NOT EXISTS catalog_products (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  source_id VARCHAR(64) NOT NULL,
  source_record_id VARCHAR(191) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(191) NULL,
  sku VARCHAR(191) NULL,
  collection_slug VARCHAR(64) NOT NULL,
  subcategory VARCHAR(191) NULL,
  product_type VARCHAR(191) NULL,
  description MEDIUMTEXT NULL,
  material VARCHAR(191) NULL,
  color VARCHAR(191) NULL,
  dimension_text VARCHAR(255) NULL,
  price_text VARCHAR(191) NULL,
  compare_at_price_text VARCHAR(191) NULL,
  currency VARCHAR(16) NULL,
  availability VARCHAR(64) NULL,
  primary_image_url TEXT NULL,
  source_url TEXT NOT NULL,
  source_payload LONGTEXT NULL,
  approved TINYINT(1) NOT NULL DEFAULT 1,
  last_source_sync_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_source_record (source_id, source_record_id),
  UNIQUE KEY uq_slug (slug),
  KEY idx_collection (collection_slug),
  KEY idx_brand (brand),
  KEY idx_source (source_id),
  KEY idx_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS catalog_product_images (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  source_url TEXT NOT NULL,
  local_url TEXT NULL,
  position INT UNSIGNED NOT NULL DEFAULT 0,
  checksum_sha1 CHAR(40) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_product_position (product_id, position),
  CONSTRAINT fk_catalog_image_product FOREIGN KEY (product_id)
    REFERENCES catalog_products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS catalog_product_attributes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  attribute_key VARCHAR(191) NOT NULL,
  attribute_value TEXT NOT NULL,
  source_value TEXT NULL,
  position INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_product_attr (product_id, attribute_key),
  CONSTRAINT fk_catalog_attr_product FOREIGN KEY (product_id)
    REFERENCES catalog_products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS catalog_sync_runs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  source_id VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'running',
  products_seen INT UNSIGNED NOT NULL DEFAULT 0,
  products_updated INT UNSIGNED NOT NULL DEFAULT 0,
  images_mirrored INT UNSIGNED NOT NULL DEFAULT 0,
  error_text MEDIUMTEXT NULL,
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_source_started (source_id, started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
