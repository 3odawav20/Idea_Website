-- Import once using cPanel > phpMyAdmin into your site's MySQL database.
-- Tables are prefixed; existing website tables are not replaced.
CREATE TABLE IF NOT EXISTS idea_users (
 id CHAR(32) PRIMARY KEY, email VARCHAR(190) NOT NULL UNIQUE, name VARCHAR(120) NOT NULL,
 password_hash VARCHAR(255) NOT NULL, role VARCHAR(16) NOT NULL DEFAULT 'buyer', phone VARCHAR(40) NOT NULL DEFAULT '', created_at BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS idea_companies (
 id CHAR(32) PRIMARY KEY, owner_id CHAR(32) NOT NULL UNIQUE, public_name VARCHAR(200) NOT NULL, legal_name VARCHAR(200) NOT NULL,
 email VARCHAR(190) NOT NULL, phone VARCHAR(40) NOT NULL, description TEXT NOT NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'submitted', business_details LONGTEXT NOT NULL, created_at BIGINT NOT NULL,
 FOREIGN KEY(owner_id) REFERENCES idea_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS idea_memberships (
 user_id CHAR(32) PRIMARY KEY, audience VARCHAR(16) NOT NULL, billing_interval VARCHAR(12) NOT NULL, status VARCHAR(16) NOT NULL, updated_at BIGINT NOT NULL,
 FOREIGN KEY(user_id) REFERENCES idea_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS idea_supplier_products (
 id CHAR(32) PRIMARY KEY, company_id CHAR(32) NOT NULL, title VARCHAR(200) NOT NULL, sku VARCHAR(100) NOT NULL DEFAULT '',
 active TINYINT NOT NULL DEFAULT 0, catalog_product_id VARCHAR(100) NOT NULL DEFAULT '', product_key CHAR(64) NOT NULL, specifications LONGTEXT NOT NULL, created_at BIGINT NOT NULL,
 INDEX(company_id), FOREIGN KEY(company_id) REFERENCES idea_companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS idea_quote_requests (
 id CHAR(32) PRIMARY KEY, buyer_id CHAR(32) NOT NULL, product_key CHAR(64) NOT NULL, product_title VARCHAR(200) NOT NULL,
 quantity DECIMAL(14,3) NOT NULL, unit VARCHAR(16) NOT NULL, governorate VARCHAR(200) NOT NULL, destination VARCHAR(1000) NOT NULL,
 delivery_date VARCHAR(30) NOT NULL, notes TEXT NOT NULL, deadline_at BIGINT NOT NULL, created_at BIGINT NOT NULL,
 INDEX(buyer_id), FOREIGN KEY(buyer_id) REFERENCES idea_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS idea_request_recipients (
 request_id CHAR(32) NOT NULL, company_id CHAR(32) NOT NULL, read_at BIGINT NULL,
 PRIMARY KEY(request_id,company_id), FOREIGN KEY(request_id) REFERENCES idea_quote_requests(id) ON DELETE CASCADE,
 FOREIGN KEY(company_id) REFERENCES idea_companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS idea_price_quotes (
 id CHAR(32) PRIMARY KEY, request_id CHAR(32) NOT NULL, company_id CHAR(32) NOT NULL,
 unit_price DECIMAL(14,2) NOT NULL, quantity DECIMAL(14,3) NOT NULL, shipping DECIMAL(14,2) NOT NULL, tax_percent DECIMAL(5,2) NOT NULL,
 total DECIMAL(18,2) NOT NULL, delivery_days INT NOT NULL, validity_days INT NOT NULL, notes TEXT NOT NULL, buyer_read_at BIGINT NULL, created_at BIGINT NOT NULL,
 UNIQUE(request_id,company_id), FOREIGN KEY(request_id) REFERENCES idea_quote_requests(id) ON DELETE CASCADE,
 FOREIGN KEY(company_id) REFERENCES idea_companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS idea_password_resets (
 token_hash CHAR(64) PRIMARY KEY, user_id CHAR(32) NOT NULL, expires_at BIGINT NOT NULL,
 FOREIGN KEY(user_id) REFERENCES idea_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS idea_auth_attempts (
 attempt_key CHAR(64) PRIMARY KEY, attempts INT NOT NULL, expires_at BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS idea_admin_messages (
 id CHAR(32) PRIMARY KEY, user_id CHAR(32) NOT NULL, admin_id CHAR(32) NOT NULL, body TEXT NOT NULL, created_at BIGINT NOT NULL,
 FOREIGN KEY(user_id) REFERENCES idea_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS idea_admin_audit (
 id CHAR(32) PRIMARY KEY, admin_id CHAR(32) NOT NULL, action VARCHAR(40) NOT NULL, subject_id CHAR(32) NOT NULL, created_at BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS idea_favorites (
 user_id CHAR(32) NOT NULL, product_id VARCHAR(100) NOT NULL, PRIMARY KEY(user_id,product_id),
 FOREIGN KEY(user_id) REFERENCES idea_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
