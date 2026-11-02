import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

/**
 * Displays a local uploaded bitmap without inserting a user-controlled URL
 * into an HTML attribute or interpreting uploaded content as markup.
 * Only decoded pixels are rendered; SVG and other active formats are refused.
 */
export function SafeBitmapCanvas({
  file,
  alt,
  style,
}: {
  file: File | null;
  alt: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !file) return;
    const allowed = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
    if (!allowed.has(file.type) || file.size <= 0 || file.size > 10 * 1024 * 1024) return;

    let disposed = false;
    let bitmap: ImageBitmap | null = null;
    let observer: ResizeObserver | null = null;

    void (async () => {
      try {
        const decoded = await createImageBitmap(file);
        if (disposed) {
          decoded.close();
          return;
        }
        bitmap = decoded;

        const draw = () => {
          if (disposed || !bitmap) return;
          const rect = canvas.getBoundingClientRect();
          const ratio = Math.min(window.devicePixelRatio || 1, 2);
          const width = Math.max(1, Math.min(4096, Math.round(rect.width * ratio)));
          const height = Math.max(1, Math.min(4096, Math.round(rect.height * ratio)));
          if (!width || !height) return;
          if (canvas.width !== width) canvas.width = width;
          if (canvas.height !== height) canvas.height = height;
          const context = canvas.getContext("2d");
          if (!context) return;
          const scale = Math.max(width / bitmap.width, height / bitmap.height);
          const cropWidth = width / scale;
          const cropHeight = height / scale;
          const sx = (bitmap.width - cropWidth) / 2;
          const sy = (bitmap.height - cropHeight) / 2;
          context.clearRect(0, 0, width, height);
          context.drawImage(bitmap, sx, sy, cropWidth, cropHeight, 0, 0, width, height);
        };

        draw();
        if (typeof ResizeObserver !== "undefined") {
          observer = new ResizeObserver(draw);
          observer.observe(canvas);
        }
      } catch {
        // A corrupt or unsupported image is never rendered as markup.
      }
    })();

    return () => {
      disposed = true;
      observer?.disconnect();
      bitmap?.close();
    };
  }, [file]);

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={alt}
      style={{ display: "block", width: "100%", height: "100%", ...style }}
    />
  );
}