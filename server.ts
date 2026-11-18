import "dotenv/config";
import path from "node:path";
import express, { type Request, type Response } from "express";
import { and, desc, eq, ilike, inArray, isNotNull, or } from "drizzle-orm";
import { db } from "./src/db/index.ts";
import {
  adPackageRates,
  adRequests,
  announcements,
  auditLogs,
  catalogueAdminPrices,
  catalogueAdminPromotions,
  catalogueOverrides,
  companies,
  companyMembers,
  favorites,
  notifications,
  offers,
  orders,
  paymentConfigs,
  plans,
  quoteRequests,
  roomProjects,
  subscriptions,
  supplierListingPrices,
  supplierListings,
  supplierPromotions,
  users,
} from "./src/db/schema.ts";
import { getOrCreateUser, updateUserRoleByUid } from "./src/db/users.ts";
import { ensureSeedData } from "./src/db/seed.ts";
import { requireAuth, requireRole, type AuthRequest } from "./src/middleware/auth.ts";
import {
  validateBusinessEmailForMethod,
  type BusinessAuthMethod,
} from "./src/app/backend/authValidation.ts";

const app = express();
app.use(express.json({ limit: "2mb" }));

let seeded = false;
async function ensureSeedOnce() {
  if (seeded) return;
  seeded = true;
  await ensureSeedData();
}

function dbError(res: Response, error: unknown, status = 500) {
  console.error("API database error:", error);
  res.status(status).json({ error: "Database request failed. Please try again later." });
}

async function logAudit(actor: string, action: string, detail: string) {
  try {
    await db.insert(auditLogs).values({ actor, action, detail });
  } catch {
    // Audit logging must not break primary operations
  }
}

async function isCompanyMemberOrAdmin(userUid: string, role: string, companyId: number) {
  if (role === "admin") return { allowed: true, memberRole: "admin", isAdmin: true };
  const rows = await db
    .select()
    .from(companyMembers)
    .where(and(eq(companyMembers.companyId, companyId), eq(companyMembers.userUid, userUid)))
    .limit(1);
  const member = rows[0];
  if (!member || member.revokedAt) return { allowed: false, memberRole: null, isAdmin: false };
  return { allowed: true, memberRole: member.memberRole, isAdmin: false };
}

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// Public read endpoints
app.get("/api/catalogue/overrides", async (_req: Request, res: Response) => {
  try {
    const rows = await db.select().from(catalogueOverrides);
    res.json(
      rows.map((r) => ({
        product_id: r.productId,
        visible: r.visible,
        name_en: r.nameEn,
        name_ar: r.nameAr,
        brand: r.brand,
        manufacturer: r.manufacturer,
        model: r.model,
        code: r.code,
        collection: r.collection,
        image_url: r.imageUrl,
        source_proof_url: r.sourceProofUrl,
        updated_at: r.updatedAt,
      }))
    );
  } catch (error) {
    dbError(res, error);
  }
});

app.get("/api/announcements", async (_req: Request, res: Response) => {
  try {
    const [annRows, sponsoredRows] = await Promise.all([
      db
        .select()
        .from(announcements)
        .where(eq(announcements.isPublished, true))
        .orderBy(desc(announcements.createdAt))
        .limit(8),
      db
        .select()
        .from(adRequests)
        .where(and(eq(adRequests.placement, "home_topline"), eq(adRequests.status, "live")))
        .orderBy(desc(adRequests.createdAt))
        .limit(4),
    ]);

    const ordinary = annRows.map((a) => ({
      id: String(a.id),
      title_ar: a.titleAr,
      title_en: a.titleEn,
      title_fr: a.titleFr,
      target_path: a.targetPath,
    }));
    const sponsored = sponsoredRows.map((s) => ({
      id: "ad-" + s.id,
      title_ar: "إعلان · " + s.titleAr,
      title_en: "Sponsored · " + (s.titleEn || s.titleAr),
      title_fr: null,
      target_path: "/products",
    }));
    res.json([...ordinary, ...sponsored]);
  } catch (error) {
    dbError(res, error);
  }
});

app.get("/api/placements/:placement", async (req: Request, res: Response) => {
  try {
    const placement = String(req.params.placement || "");
    const rows = await db
      .select()
      .from(adRequests)
      .where(
        and(
          eq(adRequests.placement, placement),
          eq(adRequests.status, "live"),
          isNotNull(adRequests.mediaUrl)
        )
      )
      .orderBy(desc(adRequests.createdAt))
      .limit(3);
    res.json(
      rows.map((r) => ({
        campaign_id: String(r.id),
        title_ar: r.titleAr,
        title_en: r.titleEn,
        media_url: r.mediaUrl,
        landing_path: "/products",
      }))
    );
  } catch (error) {
    dbError(res, error);
  }
});

app.get("/api/plans", async (_req: Request, res: Response) => {
  try {
    await ensureSeedOnce();
    const rows = await db.select().from(plans);
    res.json(rows);
  } catch (error) {
    dbError(res, error);
  }
});

app.get("/api/payments/public", async (_req: Request, res: Response) => {
  try {
    await ensureSeedOnce();
    const rows = await db.select().from(paymentConfigs);
    res.json(
      rows.map((p) => ({
        key: p.key,
        provider: p.provider,
        enabled: p.enabled,
        mode: p.mode,
        merchantConfigured: p.merchantConfigured,
        webhookOk: p.webhookOk,
        lastTest: p.lastTest,
        lastFailure: p.lastFailure,
        currency: p.currency,
      }))
    );
  } catch (error) {
    dbError(res, error);
  }
});

// Session bootstrap & state sync
app.post("/api/auth/session", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await ensureSeedOnce();
    const body = (req.body || {}) as {
      name?: string;
      phone?: string;
      authMethod?: string;
      requestedRole?: string;
    };
    const dbUser = await getOrCreateUser({
      uid: req.user!.uid,
      email: req.user!.email || null,
      phone: body.phone || req.user!.phone_number || null,
      name: body.name || (typeof req.user!.name === "string" ? req.user!.name : null),
      emailVerified: Boolean(req.user!.email_verified),
      provider: req.user!.firebase?.sign_in_provider || "firebase",
      authMethod: body.authMethod || null,
      requestedRole: body.requestedRole || null,
    });

    const isAdmin = dbUser.role === "admin";

    const [
      allPlans,
      allPayments,
      userFavs,
      userNotices,
      userProjects,
      userSubs,
      userCompaniesLinks,
      allCompanies,
      allRequests,
      allOffers,
      allOrders,
      recentAudit,
    ] = await Promise.all([
      db.select().from(plans),
      db.select().from(paymentConfigs),
      db.select().from(favorites).where(eq(favorites.userUid, dbUser.uid)),
      db
        .select()
        .from(notifications)
        .where(eq(notifications.toUid, dbUser.uid))
        .orderBy(desc(notifications.createdAt)),
      db.select().from(roomProjects).where(eq(roomProjects.userUid, dbUser.uid)),
      db.select().from(subscriptions).where(eq(subscriptions.userUid, dbUser.uid)),
      db
        .select()
        .from(companyMembers)
        .where(eq(companyMembers.userUid, dbUser.uid)),
      isAdmin
        ? db.select().from(companies).orderBy(desc(companies.createdAt))
        : db
            .select()
            .from(companies)
            .where(eq(companies.status, "verified")),
      isAdmin
        ? db.select().from(quoteRequests).orderBy(desc(quoteRequests.createdAt))
        : db.select().from(quoteRequests).orderBy(desc(quoteRequests.createdAt)),
      db.select().from(offers).orderBy(desc(offers.createdAt)),
      isAdmin
        ? db.select().from(orders).orderBy(desc(orders.createdAt))
        : db.select().from(orders).orderBy(desc(orders.createdAt)),
      isAdmin
        ? db.select().from(auditLogs).orderBy(desc(auditLogs.at)).limit(40)
        : Promise.resolve([]),
    ]);

    const memberCompanyIds = new Set(
      userCompaniesLinks.filter((m) => !m.revokedAt).map((m) => m.companyId)
    );
    const ownCompanies = isAdmin
      ? allCompanies
      : await db
          .select()
          .from(companies)
          .where(
            or(
              eq(companies.ownerUid, dbUser.uid),
              memberCompanyIds.size
                ? inArray(companies.id, [...memberCompanyIds])
                : eq(companies.status, "verified")
            )
          );

    const visibleCompanyIds = new Set(
      ownCompanies
        .filter((c) => c.ownerUid === dbUser.uid || memberCompanyIds.has(c.id))
        .map((c) => c.id)
    );

    const visibleRequests = isAdmin
      ? allRequests
      : allRequests.filter(
          (r) =>
            r.customerUid === dbUser.uid ||
            r.matchedCompanyIds.some((cid) => visibleCompanyIds.has(cid))
        );

    const visibleRequestIds = new Set(visibleRequests.map((r) => r.id));
    const visibleOffers = isAdmin
      ? allOffers
      : allOffers.filter(
          (o) => visibleCompanyIds.has(o.companyId) || visibleRequestIds.has(o.requestId)
        );
    const visibleOrders = isAdmin
      ? allOrders
      : allOrders.filter(
          (o) => o.customerUid === dbUser.uid || visibleCompanyIds.has(o.companyId)
        );

    res.json({
      user: {
        id: dbUser.uid,
        name: dbUser.name,
        email: dbUser.email || undefined,
        phone: dbUser.phone || undefined,
        role: dbUser.role,
        provider: dbUser.provider,
        authMethod: dbUser.authMethod || undefined,
        createdAt: dbUser.createdAt.getTime(),
      },
      businesses: ownCompanies.map((b) => ({
        id: String(b.id),
        ownerId: b.ownerUid,
        legalName: b.legalName,
        publicName: b.publicName,
        representative: b.representative || "",
        email: b.email || "",
        phone: b.phone || "",
        governorate: b.governorate || "Cairo",
        serviceAreas: b.serviceAreas,
        companyType: b.companyType || "Supplier",
        crNumber: b.crNumber || "",
        taxNumber: b.taxNumber || "",
        brands: b.brands,
        categories: b.categories,
        productIds: b.productIds,
        deliveryCapacityM2: b.deliveryCapacityM2,
        minOrderM2: b.minOrderM2,
        status:
          b.status === "verified"
            ? "Verified"
            : b.status === "suspended"
              ? "Suspended"
              : b.status === "rejected"
                ? "Rejected"
                : "Submitted",
        rating: b.rating,
        createdAt: b.createdAt.getTime(),
      })),
      requests: visibleRequests.map((r) => ({
        id: String(r.id),
        customerId: r.customerUid,
        productId: r.productId,
        variantLabel: r.variantLabel || "",
        quantity: r.quantity,
        unit: r.unit,
        governorate: r.governorate,
        destination: r.destination || "",
        deliveryDate: r.deliveryDate || "",
        projectType: r.projectType || "",
        phased: r.phased,
        notes: r.notes || "",
        status: r.status,
        createdAt: r.createdAt.getTime(),
        deadlineAt: r.deadlineAt.getTime(),
        matchedBusinessIds: r.matchedCompanyIds.map(String),
        acceptedOfferId: r.acceptedOfferId ? String(r.acceptedOfferId) : undefined,
      })),
      offers: visibleOffers.map((o) => ({
        id: String(o.id),
        requestId: String(o.requestId),
        businessId: String(o.companyId),
        exactProduct: o.exactProduct,
        quantity: o.quantity,
        unit: o.unit,
        unitPrice: o.unitPrice,
        shipping: o.shipping,
        taxRate: o.taxRate,
        availability: o.availability || "In stock",
        prepDays: o.prepDays,
        deliveryDays: o.deliveryDays,
        paymentTerms: o.paymentTerms || "",
        notes: o.notes || "",
        expiresAt: o.expiresAt.getTime(),
        status: o.status,
        createdAt: o.createdAt.getTime(),
      })),
      orders: visibleOrders.map((o) => ({
        id: String(o.id),
        requestId: String(o.requestId),
        offerId: String(o.offerId),
        customerId: o.customerUid,
        businessId: String(o.companyId),
        total: o.total,
        status: o.status,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt.getTime(),
      })),
      messages: userNotices.map((m) => ({
        id: String(m.id),
        to: m.toUid,
        scope: m.scope,
        kind: m.kind,
        title: m.title,
        body: m.body,
        requestId: m.referenceId || undefined,
        read: m.read,
        createdAt: m.createdAt.getTime(),
      })),
      plans: allPlans,
      subscriptions: userSubs.map((s) => ({
        userId: s.userUid,
        planId: s.planId,
        interval: s.interval,
        status: s.status,
        startedAt: s.startedAt.getTime(),
        renewsAt: s.renewsAt.getTime(),
      })),
      payments: allPayments,
      roomProjects: userProjects.map((p) => ({
        id: String(p.id),
        userId: p.userUid,
        name: p.name,
        createdAt: p.createdAt.getTime(),
        photo: p.photo,
        dims: p.dims,
        surfaces: p.surfaces,
      })),
      favorites: userFavs.map((f) => f.catalogProductId),
      audit: recentAudit.map((a) => ({
        id: String(a.id),
        at: a.at.getTime(),
        actor: a.actor,
        action: a.action,
        detail: a.detail,
      })),
    });
  } catch (error) {
    dbError(res, error);
  }
});

app.post("/api/auth/profile", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const body = (req.body || {}) as { name?: string; phone?: string; role?: string };
    const current = req.dbUser!;
    const safeRole =
      current.role === "admin" || current.role === "business"
        ? current.role
        : body.role === "designer" || body.role === "contractor" || body.role === "customer"
          ? body.role
          : current.role;

    const updated = await db
      .update(users)
      .set({
        name: body.name?.trim() || current.name,
        phone: body.phone?.trim() || current.phone,
        role: safeRole,
        updatedAt: new Date(),
      })
      .where(eq(users.uid, current.uid))
      .returning();

    res.json({ user: updated[0] });
  } catch (error) {
    dbError(res, error);
  }
});

// Business registration & company onboarding (supports business_domain | gmail | business_phone)
app.post("/api/companies/apply", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const body = (req.body || {}) as {
      legalName?: string;
      publicName?: string;
      representative?: string;
      email?: string;
      phone?: string;
      authMethod?: BusinessAuthMethod;
      country?: string;
      city?: string;
      governorate?: string;
      companyType?: string;
      crNumber?: string;
      taxNumber?: string;
      documentNames?: string[];
      brands?: string[];
      categories?: string[];
    };

    const legalName = (body.legalName || body.publicName || "").trim();
    const publicName = (body.publicName || body.legalName || "").trim();
    const authMethod: BusinessAuthMethod =
      body.authMethod === "gmail" || body.authMethod === "business_phone"
        ? body.authMethod
        : "business_domain";

    if (legalName.length < 2 || publicName.length < 2) {
      res.status(400).json({ error: "Company name must be at least 2 characters." });
      return;
    }

    const emailValue = (body.email || req.user!.email || "").trim();
    const emailValidation = validateBusinessEmailForMethod(authMethod, emailValue);
    if (!emailValidation.ok) {
      const messages = {
        invalid_email: "Please provide a valid email address.",
        corporate_domain_required:
          "Corporate business registration requires a company domain email (free webmail like Gmail/Yahoo is not allowed in this mode). Switch to the Gmail option or use a company domain.",
        gmail_required: "Please enter a @gmail.com address or choose Business Domain / Phone registration.",
      };
      res.status(400).json({ error: messages[emailValidation.code] });
      return;
    }

    const phoneValue = (body.phone || req.user!.phone_number || "").trim();
    if (authMethod === "business_phone" && !/^\+?[1-9]\d{7,14}$/.test(phoneValue.replace(/[\s()-]/g, ""))) {
      res.status(400).json({ error: "A valid business phone number is required." });
      return;
    }

    const [created] = await db
      .insert(companies)
      .values({
        ownerUid: req.user!.uid,
        legalName,
        publicName,
        representative: (body.representative || req.dbUser!.name || "").trim(),
        email: emailValue,
        phone: phoneValue,
        authMethod,
        country: (body.country || "EG").trim(),
        city: (body.city || "").trim(),
        governorate: (body.governorate || body.city || "Cairo").trim(),
        serviceAreas: [body.governorate || body.city || "Cairo"],
        companyType: (body.companyType || "Supplier").trim(),
        crNumber: (body.crNumber || "").trim(),
        taxNumber: (body.taxNumber || "").trim(),
        documentNames: Array.isArray(body.documentNames) ? body.documentNames.slice(0, 5) : [],
        brands: Array.isArray(body.brands) ? body.brands : [],
        categories: Array.isArray(body.categories) ? body.categories : ["Ceramic", "Porcelain"],
        productIds: [],
        status: "submitted",
      })
      .returning();

    await db.insert(companyMembers).values({
      companyId: created.id,
      userUid: req.user!.uid,
      userEmail: emailValue || null,
      memberRole: "owner",
    });

    if (req.dbUser!.role !== "admin") {
      await updateUserRoleByUid(req.user!.uid, "business");
    }

    await logAudit(req.user!.uid, "company.apply", `Company ${publicName} (${authMethod}) submitted.`);

    res.status(201).json({ company: created, role: req.dbUser!.role === "admin" ? "admin" : "business" });
  } catch (error) {
    dbError(res, error);
  }
});

// Companies workspace endpoints
app.get("/api/companies", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const isAdmin = req.dbUser!.role === "admin";
    const memberships = await db
      .select()
      .from(companyMembers)
      .where(eq(companyMembers.userUid, req.user!.uid));

    const allowedIds = memberships.filter((m) => !m.revokedAt).map((m) => m.companyId);
    const list = isAdmin
      ? await db.select().from(companies).orderBy(companies.publicName)
      : allowedIds.length
        ? await db
            .select()
            .from(companies)
            .where(or(eq(companies.ownerUid, req.user!.uid), inArray(companies.id, allowedIds)))
            .orderBy(companies.publicName)
        : await db.select().from(companies).where(eq(companies.ownerUid, req.user!.uid));

    res.json({ companies: list, memberships });
  } catch (error) {
    dbError(res, error);
  }
});

app.patch(
  "/api/companies/:id/status",
  requireAuth,
  requireRole("admin"),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const status = String((req.body || {}).status || "").toLowerCase();
      if (!Number.isInteger(id) || !["verified", "suspended", "submitted", "rejected"].includes(status)) {
        res.status(400).json({ error: "Invalid company ID or status." });
        return;
      }
      const [updated] = await db
        .update(companies)
        .set({ status, updatedAt: new Date() })
        .where(eq(companies.id, id))
        .returning();
      if (!updated) {
        res.status(404).json({ error: "Company not found." });
        return;
      }
      await logAudit(req.user!.uid, "company.status", `Company #${id} -> ${status}`);
      res.json({ company: updated });
    } catch (error) {
      dbError(res, error);
    }
  }
);

app.get("/api/companies/:id/workspace", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const companyId = Number(req.params.id);
    if (!Number.isInteger(companyId)) {
      res.status(400).json({ error: "Invalid company ID." });
      return;
    }
    const access = await isCompanyMemberOrAdmin(req.user!.uid, req.dbUser!.role, companyId);
    if (!access.allowed) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const [listings, members] = await Promise.all([
      db
        .select()
        .from(supplierListings)
        .where(eq(supplierListings.companyId, companyId))
        .orderBy(desc(supplierListings.createdAt))
        .limit(300),
      db.select().from(companyMembers).where(eq(companyMembers.companyId, companyId)),
    ]);

    const listingIds = listings.map((l) => l.id);
    const [prices, promos] = listingIds.length
      ? await Promise.all([
          db.select().from(supplierListingPrices).where(inArray(supplierListingPrices.listingId, listingIds)),
          db.select().from(supplierPromotions).where(inArray(supplierPromotions.listingId, listingIds)),
        ])
      : [[], []];

    res.json({ listings, prices, promos, members });
  } catch (error) {
    dbError(res, error);
  }
});

app.post("/api/companies/:id/listings", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const companyId = Number(req.params.id);
    const access = await isCompanyMemberOrAdmin(req.user!.uid, req.dbUser!.role, companyId);
    if (!access.allowed || (!access.isAdmin && !["owner", "manager"].includes(access.memberRole || ""))) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const body = (req.body || {}) as { title?: string; brandName?: string; sku?: string };
    if (!body.title?.trim()) {
      res.status(400).json({ error: "Listing title is required." });
      return;
    }
    const [created] = await db
      .insert(supplierListings)
      .values({
        companyId,
        title: body.title.trim(),
        brandName: body.brandName?.trim() || null,
        sku: body.sku?.trim() || null,
        active: false,
        approvedForStorefront: false,
      })
      .returning();
    res.status(201).json({ listing: created });
  } catch (error) {
    dbError(res, error);
  }
});

app.patch("/api/companies/:id/listings/:listingId", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const companyId = Number(req.params.id);
    const listingId = Number(req.params.listingId);
    const access = await isCompanyMemberOrAdmin(req.user!.uid, req.dbUser!.role, companyId);
    if (!access.allowed) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const body = (req.body || {}) as { active?: boolean; approvedForStorefront?: boolean };
    const patch: Partial<typeof supplierListings.$inferInsert> = { updatedAt: new Date() };
    if (typeof body.active === "boolean") patch.active = body.active;
    if (typeof body.approvedForStorefront === "boolean") {
      if (!access.isAdmin) {
        res.status(403).json({ error: "Only administrators can approve storefront publication." });
        return;
      }
      patch.approvedForStorefront = body.approvedForStorefront;
    }
    const [updated] = await db
      .update(supplierListings)
      .set(patch)
      .where(and(eq(supplierListings.id, listingId), eq(supplierListings.companyId, companyId)))
      .returning();
    res.json({ listing: updated });
  } catch (error) {
    dbError(res, error);
  }
});

app.put("/api/companies/:id/listings/:listingId/price", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const companyId = Number(req.params.id);
    const listingId = Number(req.params.listingId);
    const access = await isCompanyMemberOrAdmin(req.user!.uid, req.dbUser!.role, companyId);
    if (!access.allowed) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const priceEgp = Number((req.body || {}).priceEgp);
    if (!Number.isFinite(priceEgp) || priceEgp < 0) {
      res.status(400).json({ error: "Valid non-negative price is required." });
      return;
    }
    const [saved] = await db
      .insert(supplierListingPrices)
      .values({ listingId, priceEgp, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: supplierListingPrices.listingId,
        set: { priceEgp, updatedAt: new Date() },
      })
      .returning();
    res.json({ price: saved });
  } catch (error) {
    dbError(res, error);
  }
});

app.post("/api/companies/:id/listings/:listingId/promotions", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const companyId = Number(req.params.id);
    const listingId = Number(req.params.listingId);
    const access = await isCompanyMemberOrAdmin(req.user!.uid, req.dbUser!.role, companyId);
    if (!access.allowed) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const body = (req.body || {}) as { label?: string; offerPriceEgp?: number; startsAt?: string; endsAt?: string };
    const offerPriceEgp = Number(body.offerPriceEgp);
    if (!body.label?.trim() || !Number.isFinite(offerPriceEgp) || offerPriceEgp < 0) {
      res.status(400).json({ error: "Valid offer label and non-negative price are required." });
      return;
    }
    const [created] = await db
      .insert(supplierPromotions)
      .values({
        listingId,
        label: body.label.trim(),
        offerPriceEgp,
        startsAt: body.startsAt || null,
        endsAt: body.endsAt || null,
        isEnabled: false,
      })
      .returning();
    res.status(201).json({ promo: created });
  } catch (error) {
    dbError(res, error);
  }
});

app.patch("/api/companies/:id/listings/:listingId/promotions/:promoId", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const companyId = Number(req.params.id);
    const promoId = Number(req.params.promoId);
    const access = await isCompanyMemberOrAdmin(req.user!.uid, req.dbUser!.role, companyId);
    if (!access.allowed) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const isEnabled = Boolean((req.body || {}).isEnabled);
    const [updated] = await db
      .update(supplierPromotions)
      .set({ isEnabled })
      .where(eq(supplierPromotions.id, promoId))
      .returning();
    res.json({ promo: updated });
  } catch (error) {
    dbError(res, error);
  }
});

app.post("/api/companies/:id/members", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const companyId = Number(req.params.id);
    const access = await isCompanyMemberOrAdmin(req.user!.uid, req.dbUser!.role, companyId);
    if (!access.isAdmin && access.memberRole !== "owner") {
      res.status(403).json({ error: "Only the company owner or platform admin can invite managers." });
      return;
    }
    const email = String((req.body || {}).email || "").trim().toLowerCase();
    const targetUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const target = targetUsers[0];
    if (!target) {
      res.status(404).json({ error: "No registered IDEA account found for that email." });
      return;
    }
    const [member] = await db
      .insert(companyMembers)
      .values({ companyId, userUid: target.uid, userEmail: email, memberRole: "manager" })
      .returning();
    if (target.role !== "admin") {
      await updateUserRoleByUid(target.uid, "business");
    }
    res.status(201).json({ member });
  } catch (error) {
    dbError(res, error);
  }
});

app.patch("/api/companies/:id/members/:memberId", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const companyId = Number(req.params.id);
    const memberId = Number(req.params.memberId);
    const access = await isCompanyMemberOrAdmin(req.user!.uid, req.dbUser!.role, companyId);
    if (!access.isAdmin && access.memberRole !== "owner") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const enabled = Boolean((req.body || {}).enabled);
    const [updated] = await db
      .update(companyMembers)
      .set({ revokedAt: enabled ? null : new Date() })
      .where(and(eq(companyMembers.id, memberId), eq(companyMembers.companyId, companyId)))
      .returning();
    res.json({ member: updated });
  } catch (error) {
    dbError(res, error);
  }
});

app.post("/api/companies/:id/connect-product", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const companyId = Number(req.params.id);
    const access = await isCompanyMemberOrAdmin(req.user!.uid, req.dbUser!.role, companyId);
    if (!access.allowed) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const productId = String((req.body || {}).productId || "").trim();
    if (!productId) {
      res.status(400).json({ error: "productId is required" });
      return;
    }
    const rows = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
    const current = rows[0];
    if (!current) {
      res.status(404).json({ error: "Company not found" });
      return;
    }
    const nextIds = current.productIds.includes(productId)
      ? current.productIds
      : [...current.productIds, productId];
    const [updated] = await db
      .update(companies)
      .set({ productIds: nextIds, updatedAt: new Date() })
      .where(eq(companies.id, companyId))
      .returning();
    res.json({ company: updated });
  } catch (error) {
    dbError(res, error);
  }
});

// Verified sales report
app.get("/api/reports/sales", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const month = String(req.query.month || new Date().toISOString().slice(0, 7));
    const isAdmin = req.dbUser!.role === "admin";
    const memberships = await db
      .select()
      .from(companyMembers)
      .where(eq(companyMembers.userUid, req.user!.uid));
    const allowedIds = memberships.filter((m) => !m.revokedAt).map((m) => m.companyId);

    const visibleCompanies = isAdmin
      ? await db.select().from(companies).orderBy(companies.publicName)
      : allowedIds.length
        ? await db.select().from(companies).where(inArray(companies.id, allowedIds))
        : [];

    const allOrders = await db
      .select()
      .from(orders)
      .where(or(eq(orders.status, "Paid"), eq(orders.status, "Delivered"), eq(orders.paymentStatus, "Sandbox Authorized")));

    const monthOrders = allOrders.filter((o) => o.createdAt.toISOString().slice(0, 7) === month);
    const summaryMap = new Map<number, { company_id: number; order_count: number; gross_egp: number; refund_egp: number }>();

    for (const o of monthOrders) {
      const entry = summaryMap.get(o.companyId) || {
        company_id: o.companyId,
        order_count: 0,
        gross_egp: 0,
        refund_egp: 0,
      };
      entry.order_count += 1;
      entry.gross_egp += o.total;
      entry.refund_egp += o.refundEgp;
      summaryMap.set(o.companyId, entry);
    }

    res.json({
      companies: visibleCompanies.map((c) => ({ id: String(c.id), public_name: c.publicName })),
      sales: [...summaryMap.values()].map((s) => ({ ...s, company_id: String(s.company_id) })),
    });
  } catch (error) {
    dbError(res, error);
  }
});

// Favorites
app.get("/api/favorites", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const rows = await db.select().from(favorites).where(eq(favorites.userUid, req.user!.uid));
    res.json(rows.map((r) => r.catalogProductId));
  } catch (error) {
    dbError(res, error);
  }
});

app.post("/api/favorites", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const productId = String((req.body || {}).productId || "").trim();
    if (!productId) {
      res.status(400).json({ error: "productId is required" });
      return;
    }
    const existing = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userUid, req.user!.uid), eq(favorites.catalogProductId, productId)))
      .limit(1);
    if (!existing.length) {
      await db.insert(favorites).values({ userUid: req.user!.uid, catalogProductId: productId });
    }
    res.status(201).json({ ok: true });
  } catch (error) {
    dbError(res, error);
  }
});

app.delete("/api/favorites/:productId", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const productId = String(req.params.productId || "").trim();
    await db
      .delete(favorites)
      .where(and(eq(favorites.userUid, req.user!.uid), eq(favorites.catalogProductId, productId)));
    res.json({ ok: true });
  } catch (error) {
    dbError(res, error);
  }
});

// RFQs, offers, orders, notifications, subscriptions, room projects
app.post("/api/requests", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const body = (req.body || {}) as {
      productId: string;
      variantLabel?: string;
      quantity: number;
      unit: string;
      governorate: string;
      destination?: string;
      deliveryDate?: string;
      projectType?: string;
      phased?: boolean;
      notes?: string;
      hours?: number;
    };
    const verifiedCompanies = await db.select().from(companies).where(eq(companies.status, "verified"));
    const matchedIds = verifiedCompanies.map((c) => c.id);
    const hours = Number(body.hours) || 24;
    const deadlineAt = new Date(Date.now() + hours * 3600_000);

    const [created] = await db
      .insert(quoteRequests)
      .values({
        customerUid: req.user!.uid,
        productId: body.productId,
        variantLabel: body.variantLabel || "",
        quantity: Number(body.quantity) || 1,
        unit: body.unit === "pieces" ? "pieces" : "sqm",
        governorate: body.governorate || "Cairo",
        destination: body.destination || "",
        deliveryDate: body.deliveryDate || "",
        projectType: body.projectType || "Residential",
        phased: Boolean(body.phased),
        notes: body.notes || "",
        status: matchedIds.length ? "Awaiting Offers" : "Request Submitted",
        deadlineAt,
        matchedCompanyIds: matchedIds,
      })
      .returning();

    for (const c of verifiedCompanies) {
      await db.insert(notifications).values({
        toUid: c.ownerUid,
        scope: "business",
        kind: "rfq",
        title: "New quote request / طلب عرض سعر جديد",
        body: `${created.quantity} ${created.unit} · ${created.governorate}`,
        referenceId: String(created.id),
      });
    }

    res.status(201).json({ request: created });
  } catch (error) {
    dbError(res, error);
  }
});

app.post("/api/offers", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const body = (req.body || {}) as {
      requestId: number;
      businessId: number;
      exactProduct?: boolean;
      quantity: number;
      unit: string;
      unitPrice: number;
      shipping?: number;
      taxRate?: number;
      availability?: string;
      prepDays?: number;
      deliveryDays?: number;
      paymentTerms?: string;
      notes?: string;
      expiresAt?: number;
    };
    const companyId = Number(body.businessId);
    const requestId = Number(body.requestId);
    const access = await isCompanyMemberOrAdmin(req.user!.uid, req.dbUser!.role, companyId);
    if (!access.allowed) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const [created] = await db
      .insert(offers)
      .values({
        requestId,
        companyId,
        exactProduct: body.exactProduct !== false,
        quantity: Number(body.quantity),
        unit: body.unit || "sqm",
        unitPrice: Number(body.unitPrice),
        shipping: Number(body.shipping) || 0,
        taxRate: Number(body.taxRate ?? 0.14),
        availability: body.availability || "In stock",
        prepDays: Number(body.prepDays) || 3,
        deliveryDays: Number(body.deliveryDays) || 7,
        paymentTerms: body.paymentTerms || "",
        notes: body.notes || "",
        expiresAt: new Date(body.expiresAt || Date.now() + 72 * 3600_000),
        status: "submitted",
      })
      .returning();

    const [rfq] = await db
      .update(quoteRequests)
      .set({ status: "Offers Received" })
      .where(eq(quoteRequests.id, requestId))
      .returning();

    if (rfq) {
      await db.insert(notifications).values({
        toUid: rfq.customerUid,
        scope: "customer",
        kind: "offer",
        title: "New supplier offer received / وصل عرض سعر جديد",
        body: `${created.unitPrice} EGP/${created.unit} · ${created.quantity} ${created.unit}`,
        referenceId: String(rfq.id),
      });
    }

    res.status(201).json({ offer: created });
  } catch (error) {
    dbError(res, error);
  }
});

app.post("/api/offers/:id/accept", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const offerId = Number(req.params.id);
    const offerRows = await db.select().from(offers).where(eq(offers.id, offerId)).limit(1);
    const offer = offerRows[0];
    if (!offer) {
      res.status(404).json({ error: "Offer not found" });
      return;
    }
    const subtotal = offer.unitPrice * offer.quantity;
    const total = subtotal + subtotal * offer.taxRate + offer.shipping;

    await db.update(offers).set({ status: "not-selected" }).where(eq(offers.requestId, offer.requestId));
    await db.update(offers).set({ status: "accepted" }).where(eq(offers.id, offerId));
    await db
      .update(quoteRequests)
      .set({ status: "Offer Selected", acceptedOfferId: offerId })
      .where(eq(quoteRequests.id, offer.requestId));

    const [order] = await db
      .insert(orders)
      .values({
        requestId: offer.requestId,
        offerId: offer.id,
        customerUid: req.user!.uid,
        companyId: offer.companyId,
        total,
        status: "Pending Payment",
        paymentStatus: "None",
      })
      .returning();

    res.status(201).json({ order });
  } catch (error) {
    dbError(res, error);
  }
});

app.post("/api/orders/:id/pay", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const ok = Boolean((req.body || {}).ok);
    const [updated] = await db
      .update(orders)
      .set({
        paymentStatus: ok ? "Sandbox Authorized" : "Sandbox Failed",
        status: ok ? "Preparing" : "Pending Payment",
      })
      .where(and(eq(orders.id, id), eq(orders.customerUid, req.user!.uid)))
      .returning();
    res.json({ order: updated });
  } catch (error) {
    dbError(res, error);
  }
});

app.post("/api/subscriptions", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const body = (req.body || {}) as { planId: string; interval: "monthly" | "annual"; paid: boolean };
    const renewsAt = new Date(Date.now() + (body.interval === "annual" ? 365 : 30) * 86400_000);
    await db.delete(subscriptions).where(eq(subscriptions.userUid, req.user!.uid));
    const [created] = await db
      .insert(subscriptions)
      .values({
        userUid: req.user!.uid,
        planId: body.planId,
        interval: body.interval || "monthly",
        status: body.paid ? "active" : "payment-failed",
        renewsAt,
      })
      .returning();
    res.status(201).json({ subscription: created });
  } catch (error) {
    dbError(res, error);
  }
});

app.post("/api/subscriptions/cancel", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await db
      .update(subscriptions)
      .set({ status: "cancelled" })
      .where(eq(subscriptions.userUid, req.user!.uid));
    res.json({ ok: true });
  } catch (error) {
    dbError(res, error);
  }
});

app.patch("/api/notifications/:id/read", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, id), eq(notifications.toUid, req.user!.uid)));
    res.json({ ok: true });
  } catch (error) {
    dbError(res, error);
  }
});

app.post("/api/room-projects", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const body = (req.body || {}) as { name: string; photo?: string | null; dims: any; surfaces: any[] };
    const [created] = await db
      .insert(roomProjects)
      .values({
        userUid: req.user!.uid,
        name: body.name || "Room Project",
        photo: body.photo || null,
        dims: body.dims || { length: 4, width: 4, height: 3, unit: "m" },
        surfaces: Array.isArray(body.surfaces) ? body.surfaces : [],
      })
      .returning();
    res.status(201).json({ project: created });
  } catch (error) {
    dbError(res, error);
  }
});

app.delete("/api/room-projects/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    await db
      .delete(roomProjects)
      .where(and(eq(roomProjects.id, id), eq(roomProjects.userUid, req.user!.uid)));
    res.json({ ok: true });
  } catch (error) {
    dbError(res, error);
  }
});

// Advertising studio endpoints
app.get("/api/ads", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await ensureSeedOnce();
    const isAdmin = req.dbUser!.role === "admin";
    const memberships = await db
      .select()
      .from(companyMembers)
      .where(eq(companyMembers.userUid, req.user!.uid));
    const allowedIds = memberships.filter((m) => !m.revokedAt).map((m) => m.companyId);

    const [allCompanies, rates, requests] = await Promise.all([
      isAdmin
        ? db.select().from(companies).orderBy(companies.publicName)
        : allowedIds.length
          ? db.select().from(companies).where(inArray(companies.id, allowedIds))
          : Promise.resolve([]),
      isAdmin
        ? db.select().from(adPackageRates)
        : db.select().from(adPackageRates).where(eq(adPackageRates.isPublished, true)),
      isAdmin
        ? db.select().from(adRequests).orderBy(desc(adRequests.createdAt)).limit(200)
        : allowedIds.length
          ? db
              .select()
              .from(adRequests)
              .where(inArray(adRequests.companyId, allowedIds))
              .orderBy(desc(adRequests.createdAt))
              .limit(200)
          : Promise.resolve([]),
    ]);

    res.json({
      companies: allCompanies.map((c) => ({ id: String(c.id), public_name: c.publicName })),
      rates: rates.map((r) => ({
        placement: r.placement,
        title_ar: r.titleAr,
        title_en: r.titleEn,
        base_rate_egp: r.baseRateEgp,
        duration_days: r.durationDays,
        is_published: r.isPublished,
      })),
      campaigns: requests.map((r) => ({
        id: String(r.id),
        company_id: String(r.companyId),
        placement: r.placement,
        title_ar: r.titleAr,
        title_en: r.titleEn,
        status: r.status,
        media_url: r.mediaUrl,
        media_storage_path: r.mediaFileName,
        proposed_budget_egp: r.proposedBudgetEgp,
        service_fee_percent: r.serviceFeePercent,
        message: r.message,
      })),
    });
  } catch (error) {
    dbError(res, error);
  }
});

app.post("/api/ads", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const body = (req.body || {}) as {
      companyId: number;
      placement: string;
      titleAr: string;
      titleEn?: string;
      mediaUrl?: string;
      mediaFileName?: string;
      proposedBudgetEgp?: number | null;
      message?: string;
    };
    const companyId = Number(body.companyId);
    const access = await isCompanyMemberOrAdmin(req.user!.uid, req.dbUser!.role, companyId);
    if (!access.allowed) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const [created] = await db
      .insert(adRequests)
      .values({
        companyId,
        placement: body.placement,
        titleAr: body.titleAr.trim(),
        titleEn: body.titleEn?.trim() || null,
        status: "draft",
        mediaUrl: access.isAdmin ? body.mediaUrl?.trim() || null : null,
        mediaFileName: body.mediaFileName || null,
        proposedBudgetEgp: body.proposedBudgetEgp ?? null,
        serviceFeePercent: 15,
        message: body.message || null,
      })
      .returning();
    res.status(201).json({ campaign: created });
  } catch (error) {
    dbError(res, error);
  }
});

app.patch("/api/ads/:id/media", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const mediaUrl = String((req.body || {}).mediaUrl || "").trim();
    if (!/^https:\/\/\S+$/.test(mediaUrl)) {
      res.status(400).json({ error: "Valid HTTPS media URL is required." });
      return;
    }
    const [updated] = await db
      .update(adRequests)
      .set({ mediaUrl })
      .where(eq(adRequests.id, id))
      .returning();
    res.json({ campaign: updated });
  } catch (error) {
    dbError(res, error);
  }
});

app.patch("/api/ads/:id/status", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const status = String((req.body || {}).status || "");
    if (!["approved", "rejected", "live", "paused"].includes(status)) {
      res.status(400).json({ error: "Invalid ad status." });
      return;
    }
    const [updated] = await db
      .update(adRequests)
      .set({ status })
      .where(eq(adRequests.id, id))
      .returning();
    res.json({ campaign: updated });
  } catch (error) {
    dbError(res, error);
  }
});

app.patch("/api/admin/ad-rates/:placement", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  try {
    const placement = String(req.params.placement || "");
    const body = (req.body || {}) as { baseRateEgp: number; durationDays: number; isPublished?: boolean };
    const [updated] = await db
      .update(adPackageRates)
      .set({
        baseRateEgp: Number(body.baseRateEgp),
        durationDays: Number(body.durationDays),
        ...(typeof body.isPublished === "boolean" ? { isPublished: body.isPublished } : {}),
        updatedAt: new Date(),
      })
      .where(eq(adPackageRates.placement, placement))
      .returning();
    res.json({ rate: updated });
  } catch (error) {
    dbError(res, error);
  }
});

// Admin catalogue, code lookup, announcements, plans, payments, overview
app.get("/api/admin/overview", requireAuth, requireRole("admin"), async (_req: AuthRequest, res: Response) => {
  try {
    const [coList, reqList, offList, listList] = await Promise.all([
      db.select({ id: companies.id }).from(companies),
      db.select({ id: quoteRequests.id }).from(quoteRequests),
      db.select({ id: offers.id }).from(offers),
      db.select({ id: supplierListings.id }).from(supplierListings),
    ]);
    res.json({
      companies: coList.length,
      requests: reqList.length,
      quotes: offList.length,
      listings: listList.length,
    });
  } catch (error) {
    dbError(res, error);
  }
});

app.get("/api/admin/catalogue/overrides", requireAuth, requireRole("admin"), async (_req: AuthRequest, res: Response) => {
  try {
    const rows = await db.select().from(catalogueOverrides);
    res.json(
      rows.map((r) => ({
        product_id: r.productId,
        visible: r.visible,
        name_en: r.nameEn,
        brand: r.brand,
        manufacturer: r.manufacturer,
        model: r.model,
        code: r.code,
        collection: r.collection,
        image_url: r.imageUrl,
        source_proof_url: r.sourceProofUrl,
        updated_at: r.updatedAt,
      }))
    );
  } catch (error) {
    dbError(res, error);
  }
});

app.put("/api/admin/catalogue/overrides", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  try {
    const body = (req.body || {}) as {
      product_id: string;
      visible: boolean;
      name_en: string;
      brand: string;
      manufacturer: string | null;
      model: string | null;
      code: string | null;
      collection: string;
      image_url: string;
      source_proof_url: string;
    };
    const [saved] = await db
      .insert(catalogueOverrides)
      .values({
        productId: body.product_id,
        visible: body.visible,
        nameEn: body.name_en,
        brand: body.brand,
        manufacturer: body.manufacturer,
        model: body.model,
        code: body.code,
        collection: body.collection,
        imageUrl: body.image_url,
        sourceProofUrl: body.source_proof_url,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: catalogueOverrides.productId,
        set: {
          visible: body.visible,
          nameEn: body.name_en,
          brand: body.brand,
          manufacturer: body.manufacturer,
          model: body.model,
          code: body.code,
          collection: body.collection,
          imageUrl: body.image_url,
          sourceProofUrl: body.source_proof_url,
          updatedAt: new Date(),
        },
      })
      .returning();
    res.json({ override: saved });
  } catch (error) {
    dbError(res, error);
  }
});

app.get("/api/admin/catalogue/prices", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  try {
    const productId = req.query.productId ? String(req.query.productId) : null;
    const rows = productId
      ? await db.select().from(catalogueAdminPrices).where(eq(catalogueAdminPrices.productId, productId))
      : await db.select().from(catalogueAdminPrices);
    res.json(rows.map((r) => ({ product_id: r.productId, price: r.price, currency: r.currency })));
  } catch (error) {
    dbError(res, error);
  }
});

app.put("/api/admin/catalogue/prices", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  try {
    const body = (req.body || {}) as { productId: string; price: number | null };
    if (body.price === null) {
      await db.delete(catalogueAdminPrices).where(eq(catalogueAdminPrices.productId, body.productId));
      res.json({ deleted: true });
      return;
    }
    const [saved] = await db
      .insert(catalogueAdminPrices)
      .values({
        productId: body.productId,
        price: Number(body.price),
        currency: "EGP",
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: catalogueAdminPrices.productId,
        set: { price: Number(body.price), updatedAt: new Date() },
      })
      .returning();
    res.json({ price: saved });
  } catch (error) {
    dbError(res, error);
  }
});

app.get("/api/admin/catalogue/promotions", requireAuth, requireRole("admin"), async (_req: AuthRequest, res: Response) => {
  try {
    const rows = await db
      .select()
      .from(catalogueAdminPromotions)
      .orderBy(desc(catalogueAdminPromotions.createdAt))
      .limit(200);
    res.json(
      rows.map((r) => ({
        id: String(r.id),
        product_id: r.productId,
        source_id: r.sourceId,
        source_product_url: r.sourceProductUrl,
        offer_label: r.offerLabel,
        standard_price: r.standardPrice,
        promotional_price: r.promotionalPrice,
        currency: r.currency,
        starts_at: r.startsAt,
        ends_at: r.endsAt,
        review_status: r.reviewStatus,
        created_at: r.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    dbError(res, error);
  }
});

app.post("/api/admin/catalogue/promotions", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  try {
    const b = (req.body || {}) as Record<string, any>;
    const [created] = await db
      .insert(catalogueAdminPromotions)
      .values({
        productId: String(b.product_id),
        sourceId: String(b.source_id),
        sourceProductUrl: String(b.source_product_url),
        offerLabel: String(b.offer_label),
        standardPrice: b.standard_price !== null && b.standard_price !== undefined ? Number(b.standard_price) : null,
        promotionalPrice: Number(b.promotional_price),
        currency: "EGP",
        startsAt: b.starts_at || null,
        endsAt: b.ends_at || null,
        reviewStatus: "draft",
      })
      .returning();
    res.status(201).json({ promo: created });
  } catch (error) {
    dbError(res, error);
  }
});

app.delete("/api/admin/catalogue/promotions/:id", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    await db.delete(catalogueAdminPromotions).where(eq(catalogueAdminPromotions.id, id));
    res.json({ ok: true });
  } catch (error) {
    dbError(res, error);
  }
});

app.get("/api/admin/code-lookup", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  try {
    const q = String(req.query.q || "").trim();
    const productIdsParam = String(req.query.productIds || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const [catPrices, matchedListings] = await Promise.all([
      productIdsParam.length
        ? db.select().from(catalogueAdminPrices).where(inArray(catalogueAdminPrices.productId, productIdsParam))
        : Promise.resolve([]),
      q
        ? db
            .select()
            .from(supplierListings)
            .where(or(ilike(supplierListings.sku, `%${q}%`), ilike(supplierListings.title, `%${q}%`), ilike(supplierListings.brandName, `%${q}%`)))
            .limit(30)
        : Promise.resolve([]),
    ]);

    const listingIds = matchedListings.map((l) => l.id);
    const companyIds = [...new Set(matchedListings.map((l) => l.companyId))];

    const [listingPrices, companyRows] = await Promise.all([
      listingIds.length ? db.select().from(supplierListingPrices).where(inArray(supplierListingPrices.listingId, listingIds)) : Promise.resolve([]),
      companyIds.length ? db.select().from(companies).where(inArray(companies.id, companyIds)) : Promise.resolve([]),
    ]);

    res.json({
      cataloguePrices: catPrices.map((p) => ({ product_id: p.productId, price: p.price })),
      supplierListings: matchedListings.map((l) => ({
        id: String(l.id),
        company_id: String(l.companyId),
        title: l.title,
        sku: l.sku,
        brand_name: l.brandName,
        manufacturer_name: l.manufacturerName,
      })),
      listingPrices: listingPrices.map((p) => ({ listing_id: String(p.listingId), price_egp: p.priceEgp })),
      companies: companyRows.map((c) => ({ id: String(c.id), public_name: c.publicName })),
    });
  } catch (error) {
    dbError(res, error);
  }
});

app.get("/api/admin/announcements", requireAuth, requireRole("admin"), async (_req: AuthRequest, res: Response) => {
  try {
    const rows = await db.select().from(announcements).orderBy(desc(announcements.createdAt)).limit(100);
    res.json(
      rows.map((r) => ({
        id: String(r.id),
        title_ar: r.titleAr,
        title_en: r.titleEn,
        title_fr: r.titleFr,
        target_path: r.targetPath,
        is_published: r.isPublished,
        created_at: r.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    dbError(res, error);
  }
});

app.post("/api/admin/announcements", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  try {
    const b = (req.body || {}) as { title_ar: string; title_en: string; title_fr?: string; target_path?: string };
    const [created] = await db
      .insert(announcements)
      .values({
        titleAr: b.title_ar.trim(),
        titleEn: b.title_en.trim(),
        titleFr: b.title_fr?.trim() || null,
        targetPath: b.target_path?.trim() || null,
        isPublished: false,
      })
      .returning();
    res.status(201).json({ announcement: created });
  } catch (error) {
    dbError(res, error);
  }
});

app.patch("/api/admin/announcements/:id/publish", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const isPublished = Boolean((req.body || {}).is_published);
    const [updated] = await db
      .update(announcements)
      .set({ isPublished })
      .where(eq(announcements.id, id))
      .returning();
    res.json({ announcement: updated });
  } catch (error) {
    dbError(res, error);
  }
});

app.patch("/api/admin/plans/:id", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id || "");
    const b = (req.body || {}) as { monthly?: number; annual?: number; trialDays?: number };
    const [updated] = await db
      .update(plans)
      .set({
        ...(b.monthly !== undefined ? { monthly: Number(b.monthly) } : {}),
        ...(b.annual !== undefined ? { annual: Number(b.annual) } : {}),
        ...(b.trialDays !== undefined ? { trialDays: Number(b.trialDays) } : {}),
      })
      .where(eq(plans.id, id))
      .returning();
    res.json({ plan: updated });
  } catch (error) {
    dbError(res, error);
  }
});

app.patch("/api/admin/payments/:key", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  try {
    const key = String(req.params.key || "");
    const b = (req.body || {}) as Partial<typeof paymentConfigs.$inferInsert>;
    const [updated] = await db
      .update(paymentConfigs)
      .set({
        ...(b.mode ? { mode: b.mode } : {}),
        ...(typeof b.enabled === "boolean" ? { enabled: b.enabled } : {}),
        ...(typeof b.merchantConfigured === "boolean" ? { merchantConfigured: b.merchantConfigured } : {}),
        ...(typeof b.webhookOk === "boolean" ? { webhookOk: b.webhookOk } : {}),
      })
      .where(eq(paymentConfigs.key, key))
      .returning();
    res.json({ payment: updated });
  } catch (error) {
    dbError(res, error);
  }
});

app.post("/api/admin/payments/:key/test", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  try {
    const key = String(req.params.key || "");
    const rows = await db.select().from(paymentConfigs).where(eq(paymentConfigs.key, key)).limit(1);
    const cfg = rows[0];
    if (!cfg) {
      res.status(404).json({ error: "Payment config not found" });
      return;
    }
    const ok = cfg.merchantConfigured;
    const [updated] = await db
      .update(paymentConfigs)
      .set({
        webhookOk: ok,
        lastTest: new Date().toISOString(),
        lastFailure: ok ? null : "Merchant credentials missing",
      })
      .where(eq(paymentConfigs.key, key))
      .returning();
    res.json({ payment: updated });
  } catch (error) {
    dbError(res, error);
  }
});

// Safe Runpod status endpoints in Express runtime
app.get("/api/visualize.php", requireAuth, async (req: AuthRequest, res: Response) => {
  const isAdmin = req.dbUser!.role === "admin";
  res.json({
    integration: "configuration_required",
    provider: "Runpod",
    model: "idea-room-visualizer-v1",
    quota: {
      unlimited: isAdmin,
      used: 0,
      remaining: isAdmin ? null : 5,
      limit: isAdmin ? null : 5,
    },
  });
});

app.post("/api/visualize.php", requireAuth, async (req: AuthRequest, res: Response) => {
  const isAdmin = req.dbUser!.role === "admin";
  res.status(503).json({
    integration: "configuration_required",
    error: "Runpod GPU endpoint credentials are not configured on this server runtime.",
    quota: {
      unlimited: isAdmin,
      used: 0,
      remaining: isAdmin ? null : 5,
      limit: isAdmin ? null : 5,
    },
  });
});

app.post("/api/ask-idea.php", async (_req: Request, res: Response) => {
  res.status(503).json({
    error: "Runpod assistant endpoint is not configured on this server runtime.",
  });
});

async function startServer() {
  const port = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), "dist");
    app.use(express.static(distDir));
    app.use((_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`IDEA server listening on http://0.0.0.0:${port}`);
  });
}

void startServer();
