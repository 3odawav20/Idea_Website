import { relations } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(),
  email: text("email"),
  phone: text("phone"),
  name: text("name").notNull(),
  role: text("role").notNull().default("customer"),
  provider: text("provider").notNull().default("password"),
  authMethod: text("auth_method"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  ownerUid: text("owner_uid").notNull(),
  legalName: text("legal_name").notNull(),
  publicName: text("public_name").notNull(),
  representative: text("representative").default(""),
  email: text("email").default(""),
  phone: text("phone").default(""),
  authMethod: text("auth_method").default("business_domain"),
  country: text("country").default("EG"),
  city: text("city").default(""),
  governorate: text("governorate").default("Cairo"),
  serviceAreas: jsonb("service_areas").$type<string[]>().default([]).notNull(),
  companyType: text("company_type").default("Supplier"),
  crNumber: text("cr_number").default(""),
  taxNumber: text("tax_number").default(""),
  documentNames: jsonb("document_names").$type<string[]>().default([]).notNull(),
  brands: jsonb("brands").$type<string[]>().default([]).notNull(),
  categories: jsonb("categories").$type<string[]>().default([]).notNull(),
  productIds: jsonb("product_ids").$type<string[]>().default([]).notNull(),
  deliveryCapacityM2: integer("delivery_capacity_m2").default(1000).notNull(),
  minOrderM2: integer("min_order_m2").default(20).notNull(),
  status: text("status").notNull().default("submitted"),
  rating: doublePrecision("rating").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const companyMembers = pgTable("company_members", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id")
    .references(() => companies.id, { onDelete: "cascade" })
    .notNull(),
  userUid: text("user_uid").notNull(),
  userEmail: text("user_email"),
  memberRole: text("member_role").notNull().default("owner"),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const supplierListings = pgTable("supplier_listings", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id")
    .references(() => companies.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  sku: text("sku"),
  brandName: text("brand_name"),
  manufacturerName: text("manufacturer_name"),
  catalogProductId: text("catalog_product_id"),
  active: boolean("active").default(false).notNull(),
  approvedForStorefront: boolean("approved_for_storefront").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const supplierListingPrices = pgTable("supplier_listing_prices", {
  listingId: integer("listing_id")
    .primaryKey()
    .references(() => supplierListings.id, { onDelete: "cascade" }),
  priceEgp: doublePrecision("price_egp").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const supplierPromotions = pgTable("supplier_promotions", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id")
    .references(() => supplierListings.id, { onDelete: "cascade" })
    .notNull(),
  label: text("label").notNull(),
  offerPriceEgp: doublePrecision("offer_price_egp").notNull(),
  startsAt: text("starts_at"),
  endsAt: text("ends_at"),
  isEnabled: boolean("is_enabled").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const quoteRequests = pgTable("quote_requests", {
  id: serial("id").primaryKey(),
  customerUid: text("customer_uid").notNull(),
  productId: text("product_id").notNull(),
  variantLabel: text("variant_label").default(""),
  quantity: doublePrecision("quantity").notNull(),
  unit: text("unit").notNull().default("sqm"),
  governorate: text("governorate").notNull().default("Cairo"),
  destination: text("destination").default(""),
  deliveryDate: text("delivery_date").default(""),
  projectType: text("project_type").default("Residential"),
  phased: boolean("phased").default(false).notNull(),
  notes: text("notes").default(""),
  status: text("status").notNull().default("Request Submitted"),
  deadlineAt: timestamp("deadline_at").notNull(),
  matchedCompanyIds: jsonb("matched_company_ids").$type<number[]>().default([]).notNull(),
  acceptedOfferId: integer("accepted_offer_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id")
    .references(() => quoteRequests.id, { onDelete: "cascade" })
    .notNull(),
  companyId: integer("company_id")
    .references(() => companies.id, { onDelete: "cascade" })
    .notNull(),
  exactProduct: boolean("exact_product").default(true).notNull(),
  quantity: doublePrecision("quantity").notNull(),
  unit: text("unit").notNull().default("sqm"),
  unitPrice: doublePrecision("unit_price").notNull(),
  shipping: doublePrecision("shipping").default(0).notNull(),
  taxRate: doublePrecision("tax_rate").default(0.14).notNull(),
  availability: text("availability").default("In stock"),
  prepDays: integer("prep_days").default(3).notNull(),
  deliveryDays: integer("delivery_days").default(7).notNull(),
  paymentTerms: text("payment_terms").default(""),
  notes: text("notes").default(""),
  expiresAt: timestamp("expires_at").notNull(),
  status: text("status").notNull().default("submitted"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id")
    .references(() => quoteRequests.id, { onDelete: "cascade" })
    .notNull(),
  offerId: integer("offer_id")
    .references(() => offers.id, { onDelete: "cascade" })
    .notNull(),
  customerUid: text("customer_uid").notNull(),
  companyId: integer("company_id")
    .references(() => companies.id, { onDelete: "cascade" })
    .notNull(),
  total: doublePrecision("total").notNull(),
  refundEgp: doublePrecision("refund_egp").default(0).notNull(),
  status: text("status").notNull().default("Pending Payment"),
  paymentStatus: text("payment_status").notNull().default("None"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  toUid: text("to_uid").notNull(),
  scope: text("scope").notNull().default("customer"),
  kind: text("kind").notNull().default("system"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  referenceId: text("reference_id"),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const roomProjects = pgTable("room_projects", {
  id: serial("id").primaryKey(),
  userUid: text("user_uid").notNull(),
  name: text("name").notNull(),
  photo: text("photo"),
  dims: jsonb("dims").$type<{ length: number; width: number; height: number; unit: "m" | "cm" | "mm" }>().notNull(),
  surfaces: jsonb("surfaces").$type<{ id: string; label: string; productId: string | null; estM2: number }[]>().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const catalogueOverrides = pgTable("catalogue_overrides", {
  productId: text("product_id").primaryKey(),
  visible: boolean("visible").default(true).notNull(),
  nameEn: text("name_en"),
  nameAr: text("name_ar"),
  brand: text("brand"),
  manufacturer: text("manufacturer"),
  model: text("model"),
  code: text("code"),
  collection: text("collection"),
  imageUrl: text("image_url"),
  sourceProofUrl: text("source_proof_url"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const catalogueAdminPrices = pgTable("catalogue_admin_prices", {
  productId: text("product_id").primaryKey(),
  price: doublePrecision("price").notNull(),
  currency: text("currency").default("EGP").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const catalogueAdminPromotions = pgTable("catalogue_admin_promotions", {
  id: serial("id").primaryKey(),
  productId: text("product_id").notNull(),
  sourceId: text("source_id").notNull(),
  sourceProductUrl: text("source_product_url").notNull(),
  offerLabel: text("offer_label").notNull(),
  standardPrice: doublePrecision("standard_price"),
  promotionalPrice: doublePrecision("promotional_price").notNull(),
  currency: text("currency").default("EGP").notNull(),
  startsAt: text("starts_at"),
  endsAt: text("ends_at"),
  reviewStatus: text("review_status").default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  titleAr: text("title_ar").notNull(),
  titleEn: text("title_en").notNull(),
  titleFr: text("title_fr"),
  targetPath: text("target_path"),
  isPublished: boolean("is_published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adPackageRates = pgTable("ad_package_rates", {
  placement: text("placement").primaryKey(),
  titleAr: text("title_ar").notNull(),
  titleEn: text("title_en").notNull(),
  baseRateEgp: doublePrecision("base_rate_egp").notNull(),
  durationDays: integer("duration_days").notNull(),
  isPublished: boolean("is_published").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const adRequests = pgTable("ad_requests", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id")
    .references(() => companies.id, { onDelete: "cascade" })
    .notNull(),
  placement: text("placement").notNull(),
  titleAr: text("title_ar").notNull(),
  titleEn: text("title_en"),
  status: text("status").notNull().default("draft"),
  mediaUrl: text("media_url"),
  mediaFileName: text("media_file_name"),
  proposedBudgetEgp: doublePrecision("proposed_budget_egp"),
  serviceFeePercent: doublePrecision("service_fee_percent").default(15).notNull(),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const plans = pgTable("plans", {
  id: text("id").primaryKey(),
  audience: text("audience").notNull(),
  name: text("name").notNull(),
  monthly: doublePrecision("monthly").notNull(),
  annual: doublePrecision("annual").notNull(),
  trialDays: integer("trial_days").default(14).notNull(),
  features: jsonb("features").$type<string[]>().default([]).notNull(),
  activeRequests: integer("active_requests").default(10).notNull(),
  offerLimit: integer("offer_limit").default(20).notNull(),
  hdRenders: integer("hd_renders").default(5).notNull(),
  teamMembers: integer("team_members").default(1).notNull(),
  featuredEligible: boolean("featured_eligible").default(false).notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userUid: text("user_uid").notNull(),
  planId: text("plan_id")
    .references(() => plans.id, { onDelete: "cascade" })
    .notNull(),
  interval: text("interval").notNull().default("monthly"),
  status: text("status").notNull().default("active"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  renewsAt: timestamp("renews_at").notNull(),
});

export const paymentConfigs = pgTable("payment_configs", {
  key: text("key").primaryKey(),
  provider: text("provider").notNull(),
  enabled: boolean("enabled").default(false).notNull(),
  mode: text("mode").default("sandbox").notNull(),
  merchantConfigured: boolean("merchant_configured").default(false).notNull(),
  webhookOk: boolean("webhook_ok").default(false).notNull(),
  lastTest: text("last_test"),
  lastFailure: text("last_failure"),
  currency: text("currency").default("EGP").notNull(),
});

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userUid: text("user_uid").notNull(),
  catalogProductId: text("catalog_product_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  at: timestamp("at").defaultNow().notNull(),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  detail: text("detail").notNull(),
});

export const companiesRelations = relations(companies, ({ many }) => ({
  members: many(companyMembers),
  listings: many(supplierListings),
  offers: many(offers),
  adRequests: many(adRequests),
}));

export const supplierListingsRelations = relations(supplierListings, ({ one, many }) => ({
  company: one(companies, { fields: [supplierListings.companyId], references: [companies.id] }),
  price: one(supplierListingPrices, { fields: [supplierListings.id], references: [supplierListingPrices.listingId] }),
  promotions: many(supplierPromotions),
}));
