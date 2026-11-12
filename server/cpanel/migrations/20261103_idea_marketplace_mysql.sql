-- IDEA marketplace sidecars. Additive-only migration; protects old user/company/order records.
CREATE TABLE IF NOT EXISTS idea_marketplace_product_meta (
 product_id CHAR(32) NOT NULL PRIMARY KEY,
 company_id CHAR(32) NOT NULL,
 product_code VARCHAR(100) NOT NULL,
 brand VARCHAR(190) NOT NULL DEFAULT '',
 manufacturer VARCHAR(190) NOT NULL DEFAULT '',
 category VARCHAR(40) NOT NULL DEFAULT 'ceramic',
 size_label VARCHAR(80) NOT NULL DEFAULT '',
 width_mm DECIMAL(9,2) NULL,
 height_mm DECIMAL(9,2) NULL,
 finish VARCHAR(100) NOT NULL DEFAULT '',
 color VARCHAR(100) NOT NULL DEFAULT '',
 image_url VARCHAR(500) NOT NULL DEFAULT '',
 private_price_cents BIGINT UNSIGNED NULL,
 currency CHAR(3) NOT NULL DEFAULT 'EGP',
 approved_for_storefront TINYINT(1) NOT NULL DEFAULT 0,
 admin_notes VARCHAR(1000) NOT NULL DEFAULT '',
 updated_at BIGINT NOT NULL,
 UNIQUE KEY uq_idea_company_product_code(company_id,product_code),
 INDEX idx_idea_meta_company(company_id),
 INDEX idx_idea_meta_brand(brand),
 INDEX idx_idea_meta_mfg(manufacturer),
 INDEX idx_idea_meta_size(width_mm,height_mm),
 INDEX idx_idea_meta_review(approved_for_storefront)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS idea_company_staff (
 id CHAR(32) NOT NULL PRIMARY KEY,
 company_id CHAR(32) NOT NULL,
 user_id CHAR(32) NOT NULL,
 role VARCHAR(30) NOT NULL DEFAULT 'manager',
 active TINYINT(1) NOT NULL DEFAULT 1,
 created_at BIGINT NOT NULL,
 updated_at BIGINT NOT NULL,
 UNIQUE KEY uq_idea_company_staff(company_id,user_id),
 INDEX idx_idea_company_staff_user(user_id,active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS idea_marketplace_announcements (
 id CHAR(32) NOT NULL PRIMARY KEY,
 text_ar VARCHAR(500) NOT NULL,
 text_en VARCHAR(500) NOT NULL,
 link_path VARCHAR(300) NOT NULL DEFAULT '',
 state VARCHAR(24) NOT NULL DEFAULT 'draft',
 start_at BIGINT NULL,
 end_at BIGINT NULL,
 created_at BIGINT NOT NULL,
 updated_at BIGINT NOT NULL,
 INDEX idx_idea_announcement_state(state,start_at,end_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS idea_marketplace_ad_packages (
 id VARCHAR(40) NOT NULL PRIMARY KEY,
 title_ar VARCHAR(160) NOT NULL,
 title_en VARCHAR(160) NOT NULL,
 description_ar VARCHAR(700) NOT NULL DEFAULT '',
 description_en VARCHAR(700) NOT NULL DEFAULT '',
 placement VARCHAR(40) NOT NULL,
 price_cents BIGINT UNSIGNED NOT NULL,
 duration_days SMALLINT UNSIGNED NOT NULL,
 specs VARCHAR(600) NOT NULL,
 is_published TINYINT(1) NOT NULL DEFAULT 0,
 updated_at BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS idea_marketplace_ad_requests (
 id CHAR(32) NOT NULL PRIMARY KEY,
 company_id CHAR(32) NOT NULL,
 user_id CHAR(32) NOT NULL,
 package_id VARCHAR(40) NOT NULL,
 title VARCHAR(160) NOT NULL,
 message TEXT NOT NULL,
 media_kind VARCHAR(20) NOT NULL DEFAULT 'image',
 media_name VARCHAR(190) NOT NULL DEFAULT '',
 private_storage_key CHAR(64) NOT NULL DEFAULT '',
 state VARCHAR(25) NOT NULL DEFAULT 'pending',
 admin_notes TEXT NULL,
 created_at BIGINT NOT NULL,
 updated_at BIGINT NOT NULL,
 INDEX idx_idea_ad_company(company_id,created_at),
 INDEX idx_idea_ad_state(state,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- IDEA internal ad inventory; unpublished example prices, never external Google/Meta auction prices.
INSERT IGNORE INTO idea_marketplace_ad_packages
(id,title_ar,title_en,description_ar,description_en,placement,price_cents,duration_days,specs,is_published,updated_at) VALUES
('topline','الشريط العلوي','Top line','شريط ثابت أعلى الموقع','Sticky header placement','topline',250000,7,'Text max 100 chars, Arabic and English',0,0),
('new-collections','المجموعات الجديدة','New Collections','إبراز المجموعة داخل المنتجات الجديدة','Featured product cards','new_collections',450000,14,'Image PNG/JPEG/WebP, 1600x900 recommended, <=5 MB',0,0),
('home-hero-video','فيديو هيرو الرئيسية','Homepage Hero Video','فيديو بارز بالصفحة الرئيسية بعد مراجعة الإدارة','Hero video subject to review','home_hero_video',900000,7,'MP4 H264, 1920x1080, 16:9, 6-20s, <=40 MB; admin preapproval mandatory',0,0);
