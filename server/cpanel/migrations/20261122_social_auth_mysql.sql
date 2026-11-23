-- IDEA Marketplace — Additive Social Authentication & WhatsApp OTP Schema
-- Safe to run on production MySQL 8+ / MariaDB 10.6+ (idempotent, non-destructive).
-- Preserves all existing idea_users, passwords, company accounts, and marketplace tables.

CREATE TABLE IF NOT EXISTS idea_social_identities (
  id CHAR(32) NOT NULL PRIMARY KEY,
  user_id CHAR(32) NOT NULL,
  provider VARCHAR(24) NOT NULL,
  provider_subject VARCHAR(191) NOT NULL,
  provider_email VARCHAR(255) NULL,
  email_verified TINYINT(1) NOT NULL DEFAULT 0,
  provider_phone VARCHAR(40) NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  last_login_at BIGINT NULL,
  UNIQUE KEY uq_social_provider_subject (provider, provider_subject),
  KEY idx_social_user_id (user_id),
  KEY idx_social_provider_email (provider, provider_email),
  CONSTRAINT fk_social_identities_user
    FOREIGN KEY (user_id) REFERENCES idea_users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS idea_social_oauth_states (
  state_hash CHAR(64) NOT NULL PRIMARY KEY,
  provider VARCHAR(24) NOT NULL,
  mode VARCHAR(16) NOT NULL DEFAULT 'login',
  redirect_path VARCHAR(255) NOT NULL DEFAULT '/account',
  code_verifier VARCHAR(160) NOT NULL,
  nonce VARCHAR(96) NOT NULL,
  ip_hash CHAR(64) NOT NULL,
  created_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL,
  used_at BIGINT NULL,
  KEY idx_social_states_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS idea_whatsapp_otps (
  id CHAR(32) NOT NULL PRIMARY KEY,
  phone_hash CHAR(64) NOT NULL,
  phone_e164 VARCHAR(40) NOT NULL,
  code_hash CHAR(64) NOT NULL,
  attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  expires_at BIGINT NOT NULL,
  consumed_at BIGINT NULL,
  created_at BIGINT NOT NULL,
  KEY idx_wa_otps_phone_active (phone_hash, consumed_at, created_at),
  KEY idx_wa_otps_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS idea_social_rate_limits (
  bucket_key VARCHAR(128) NOT NULL PRIMARY KEY,
  hits INT UNSIGNED NOT NULL DEFAULT 1,
  window_start BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  KEY idx_social_rate_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
