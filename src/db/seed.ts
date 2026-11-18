import { db } from "./index.ts";
import { adPackageRates, paymentConfigs, plans } from "./schema.ts";

export async function ensureSeedData(): Promise<void> {
  try {
    await db
      .insert(plans)
      .values([
        {
          id: "cust-free",
          audience: "customer",
          name: "Home Explorer",
          monthly: 0,
          annual: 0,
          trialDays: 0,
          features: ["Browse curated catalog", "Up to 3 active RFQ requests", "3D Room Studio access"],
          activeRequests: 3,
          offerLimit: 10,
          hdRenders: 2,
          teamMembers: 1,
          featuredEligible: false,
        },
        {
          id: "cust-pro",
          audience: "customer",
          name: "Designer & Pro",
          monthly: 290,
          annual: 2900,
          trialDays: 14,
          features: ["Unlimited RFQ requests", "Priority supplier matching", "HD 3D renders & saved projects"],
          activeRequests: 50,
          offerLimit: 100,
          hdRenders: 25,
          teamMembers: 3,
          featuredEligible: false,
        },
        {
          id: "biz-starter",
          audience: "business",
          name: "Verified Supplier",
          monthly: 850,
          annual: 8500,
          trialDays: 14,
          features: ["Company storefront workspace", "Private price & promotion ledger", "Receive matched RFQs"],
          activeRequests: 20,
          offerLimit: 40,
          hdRenders: 10,
          teamMembers: 3,
          featuredEligible: false,
        },
        {
          id: "biz-enterprise",
          audience: "business",
          name: "Manufacturer & Group",
          monthly: 2400,
          annual: 24000,
          trialDays: 14,
          features: ["Multi-brand management", "Unlimited offers & team managers", "Featured placement eligibility"],
          activeRequests: 200,
          offerLimit: 500,
          hdRenders: 50,
          teamMembers: 15,
          featuredEligible: true,
        },
      ])
      .onConflictDoNothing();

    await db
      .insert(paymentConfigs)
      .values([
        { key: "card", provider: "Paymob / Meeza Cards", enabled: false, mode: "sandbox", merchantConfigured: false, webhookOk: false, currency: "EGP" },
        { key: "fawry", provider: "Fawry Pay", enabled: false, mode: "sandbox", merchantConfigured: false, webhookOk: false, currency: "EGP" },
        { key: "wallet", provider: "Mobile Wallets (Vodafone / Orange / e&)", enabled: false, mode: "sandbox", merchantConfigured: false, webhookOk: false, currency: "EGP" },
        { key: "applepay", provider: "Apple Pay", enabled: false, mode: "sandbox", merchantConfigured: false, webhookOk: false, currency: "EGP" },
        { key: "bank", provider: "InstaPay / Bank Transfer", enabled: false, mode: "sandbox", merchantConfigured: false, webhookOk: false, currency: "EGP" },
      ])
      .onConflictDoNothing();

    await db
      .insert(adPackageRates)
      .values([
        { placement: "home_topline", titleAr: "الشريط العلوي في الرئيسية", titleEn: "Top line banner", baseRateEgp: 2500, durationDays: 7, isPublished: false },
        { placement: "new_collections", titleAr: "كروت المجموعات المختارة", titleEn: "New Collections card", baseRateEgp: 4500, durationDays: 14, isPublished: false },
        { placement: "home_hero_video", titleAr: "فيديو الهيرو الرئيسي", titleEn: "Home video hero", baseRateEgp: 9000, durationDays: 7, isPublished: false },
        { placement: "google_ads", titleAr: "حملات Google Ads المدارة", titleEn: "Google Ads managed", baseRateEgp: 3500, durationDays: 14, isPublished: false },
        { placement: "meta_ads", titleAr: "حملات Facebook & Instagram", titleEn: "Facebook & Instagram managed", baseRateEgp: 3500, durationDays: 14, isPublished: false },
      ])
      .onConflictDoNothing();
  } catch (error) {
    console.error("Seed check failed:", error);
  }
}
