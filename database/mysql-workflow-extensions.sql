-- Additive migration: back up the selected IDEA database before importing.
CREATE TABLE IF NOT EXISTS idea_quote_signatures (
 quote_id CHAR(32) PRIMARY KEY, strokes LONGTEXT NOT NULL, payment_terms VARCHAR(2000) NOT NULL,
 revision INT NOT NULL DEFAULT 1, signed_at BIGINT NOT NULL,
 FOREIGN KEY(quote_id) REFERENCES idea_price_quotes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS idea_quote_awards (
 request_id CHAR(32) PRIMARY KEY, quote_id CHAR(32) NOT NULL UNIQUE, buyer_id CHAR(32) NOT NULL, created_at BIGINT NOT NULL,
 FOREIGN KEY(request_id) REFERENCES idea_quote_requests(id) ON DELETE CASCADE,
 FOREIGN KEY(quote_id) REFERENCES idea_price_quotes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS idea_quote_rejections (
 quote_id CHAR(32) PRIMARY KEY, buyer_id CHAR(32) NOT NULL, created_at BIGINT NOT NULL,
 FOREIGN KEY(quote_id) REFERENCES idea_price_quotes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
