CREATE TABLE IF NOT EXISTS idea_auth_identities (
  user_id CHAR(32) NOT NULL,
  provider VARCHAR(20) NOT NULL,
  subject VARCHAR(190) NOT NULL,
  created_at BIGINT(20) NOT NULL,
  PRIMARY KEY (provider, subject),
  KEY idx_idea_auth_identities_user_id (user_id),
  CONSTRAINT fk_idea_auth_identities_user
    FOREIGN KEY (user_id) REFERENCES idea_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;