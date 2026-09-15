import { requireSupabase } from "./supabaseClient";

export const PRIVATE_REQUEST_BUCKET = "request-references";

function assertOwnedPath(path: string, userId: string) {
  if (!path.startsWith(`${userId}/`)) {
    throw new Error("You are not allowed to access this private file.");
  }
}

export const privateStorage = {
  async upload(userId: string, file: File) {
    if (!file.type.startsWith("image/")) throw new Error("Only image files can be uploaded.");
    if (file.size > 10 * 1024 * 1024) throw new Error("Image files must be 10 MB or smaller.");
    const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
    const path = `${userId}/${crypto.randomUUID()}.${extension}`;
    const { error } = await requireSupabase().storage.from(PRIVATE_REQUEST_BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
    if (error) throw error;
    return path;
  },
  async remove(userId: string, path: string) {
    assertOwnedPath(path, userId);
    const { error } = await requireSupabase().storage.from(PRIVATE_REQUEST_BUCKET).remove([path]);
    if (error) throw error;
  },
  async signedUrl(userId: string, path: string, expiresIn = 300) {
    assertOwnedPath(path, userId);
    const { data, error } = await requireSupabase().storage.from(PRIVATE_REQUEST_BUCKET).createSignedUrl(path, expiresIn);
    if (error) throw error;
    return data.signedUrl;
  },
};
