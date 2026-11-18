import { eq } from "drizzle-orm";
import { db } from "./index.ts";
import { users } from "./schema.ts";

const PRIMARY_ADMIN_EMAIL = "abdelrahmanamr895@gmail.com";

export type DbUser = typeof users.$inferSelect;

export interface SyncUserInput {
  uid: string;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  emailVerified?: boolean;
  provider?: string | null;
  authMethod?: string | null;
  requestedRole?: string | null;
}

export async function getOrCreateUser(input: SyncUserInput): Promise<DbUser> {
  const normalizedEmail = input.email ? input.email.trim().toLowerCase() : null;
  const isBootstrapAdmin =
    normalizedEmail === PRIMARY_ADMIN_EMAIL && Boolean(input.emailVerified);
  const displayName =
    (input.name && input.name.trim()) ||
    normalizedEmail?.split("@")[0] ||
    input.phone ||
    "IDEA Member";
  const provider = (input.provider && input.provider.trim()) || "firebase";
  const safeInitialRole =
    isBootstrapAdmin
      ? "admin"
      : input.requestedRole === "designer" || input.requestedRole === "contractor"
        ? input.requestedRole
        : "customer";

  try {
    const existingRows = await db
      .select()
      .from(users)
      .where(eq(users.uid, input.uid))
      .limit(1);
    const existing = existingRows[0];

    const resolvedRole = isBootstrapAdmin
      ? "admin"
      : existing?.role || safeInitialRole;

    const result = await db
      .insert(users)
      .values({
        uid: input.uid,
        email: normalizedEmail,
        phone: input.phone || null,
        name: displayName,
        role: resolvedRole,
        provider,
        authMethod: input.authMethod || null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: normalizedEmail ?? existing?.email ?? null,
          phone: input.phone ?? existing?.phone ?? null,
          name: existing?.name && existing.name !== "IDEA Member" ? existing.name : displayName,
          role: resolvedRole,
          provider,
          ...(input.authMethod ? { authMethod: input.authMethod } : {}),
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Failed to sync user record:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function getUserByUid(uid: string): Promise<DbUser | null> {
  try {
    const rows = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return rows[0] || null;
  } catch (error) {
    console.error("Failed to fetch user by UID:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function updateUserRoleByUid(uid: string, role: string): Promise<DbUser | null> {
  try {
    const rows = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.uid, uid))
      .returning();
    return rows[0] || null;
  } catch (error) {
    console.error("Failed to update user role:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}
