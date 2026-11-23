import { apiFetch, ApiError } from "./apiClient";
import { PHP_PLATFORM_API } from "./phpAccounts";

export interface VisualizerQuota {
  limit: number | null;
  used: number;
  remaining: number | null;
  unlimited: boolean;
}
export interface VisualizerJob {
  id: string;
  state: "queued" | "processing" | "completed" | "failed";
  error_code?: string;
  settings?: Record<string, unknown>;
}
const endpoint = (action: string) => `${PHP_PLATFORM_API}?action=${action}`;

export async function getVisualizerQuota(): Promise<VisualizerQuota> {
  const response = await apiFetch<VisualizerQuota>(endpoint("ai-quota"), { authRequired: true });
  if (typeof response.unlimited !== "boolean") throw new ApiError("AI_QUOTA_INVALID", 502);
  if (!response.unlimited && (!Number.isFinite(response.remaining) || !Number.isFinite(response.limit))) {
    throw new ApiError("AI_QUOTA_INVALID", 502);
  }
  return response;
}
export async function createVisualizerJob(body: Record<string, unknown>): Promise<VisualizerJob> {
  return await apiFetch<VisualizerJob>(endpoint("ai-create"), { method: "POST", body, authRequired: true });
}
export async function startVisualizerJob(id: string): Promise<VisualizerJob> {
  return await apiFetch<VisualizerJob>(endpoint("ai-process"), { method: "POST", body: { id }, authRequired: true });
}
export async function getVisualizerJob(id: string): Promise<VisualizerJob> {
  return await apiFetch<VisualizerJob>(`${endpoint("ai-job")}&id=${encodeURIComponent(id)}`, { authRequired: true });
}
export async function getVisualizerImage(id: string, signal?: AbortSignal): Promise<{ url: string; extension: string }> {
  const response = await fetch(`${endpoint("ai-image")}&id=${encodeURIComponent(id)}`, {
    credentials: "same-origin", cache: "no-store", headers: { Accept: "image/png,image/jpeg" }, signal,
  });
  if (!response.ok) {
    let code = "AI_IMAGE_UNAVAILABLE";
    if ((response.headers.get("content-type") || "").includes("application/json")) {
      const error = await response.json().catch(() => null);
      if (typeof error?.error === "string") code = error.error;
    }
    throw new ApiError(code, response.status);
  }
  const type = (response.headers.get("content-type") || "").split(";")[0].toLowerCase();
  if (!["image/png", "image/jpeg"].includes(type)) throw new ApiError("AI_IMAGE_FORMAT_INVALID", 502);
  const image = await response.blob();
  if (image.size < 100 || image.size > 25000000) throw new ApiError("AI_IMAGE_INVALID", 502);
  return { url: URL.createObjectURL(image), extension: type === "image/png" ? "png" : "jpg" };
}

/** Normalize a real uploaded image to the server's bounded 8 MB JPEG contract.
 * Uses the uploaded pixels and original dimensions; does not synthesize data.
 */
export async function imageToPhpDataUrl(source: Blob): Promise<string> {
  if (source.size < 1 || source.size > 12 * 1024 * 1024) throw new ApiError("IMAGE_FILE_SIZE_INVALID", 413);
  const image = await createImageBitmap(source);
  try {
    if (image.width < 256 || image.height < 256 || image.width * image.height > 10_000_000) {
      throw new ApiError("IMAGE_DIMENSIONS_INVALID", 422);
    }
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new ApiError("IMAGE_ENCODER_UNAVAILABLE", 503);
    ctx.drawImage(image, 0, 0);
    let data: Blob | null = null;
    for (const quality of [0.93, 0.88, 0.8]) {
      data = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", quality));
      if (data && data.size <= 8 * 1024 * 1024) break;
    }
    if (!data || data.size > 8 * 1024 * 1024) throw new ApiError("IMAGE_COMPRESSED_TOO_LARGE", 413);
    const result = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new ApiError("IMAGE_ENCODING_FAILED", 500));
      reader.onload = () => resolve(String(reader.result || ""));
      reader.readAsDataURL(data);
    });
    if (!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(result)) throw new ApiError("IMAGE_ENCODING_INVALID", 500);
    return result;
  } finally {
    image.close();
  }
}
