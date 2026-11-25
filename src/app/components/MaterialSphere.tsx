import { useEffect, useRef, useState } from "react";
import "./MaterialSphere.css";

type MaterialSphereProps = {
  src: string;
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
};

/**
 * Render a real spherical UV projection of the supplied material face.
 * The canvas is a lightweight 2D render (no WebGL context per catalogue card),
 * while the original image remains as an accessible and resilient fallback.
 */
function renderMaterialSphere(source: HTMLImageElement, canvas: HTMLCanvasElement): boolean {
  if (!source.naturalWidth || !source.naturalHeight) return false;

  const size = 512;
  const textureWidth = 768;
  const textureHeight = 384;
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = textureWidth;
  textureCanvas.height = textureHeight;

  const textureContext = textureCanvas.getContext("2d", { willReadFrequently: true });
  const outputContext = canvas.getContext("2d");
  if (!textureContext || !outputContext) return false;

  // Prepare a seamless 2:1 spherical texture from the source tile face.
  const scale = Math.max(textureWidth / source.naturalWidth, textureHeight / source.naturalHeight);
  const drawWidth = source.naturalWidth * scale;
  const drawHeight = source.naturalHeight * scale;
  textureContext.clearRect(0, 0, textureWidth, textureHeight);
  textureContext.drawImage(
    source,
    (textureWidth - drawWidth) / 2,
    (textureHeight - drawHeight) / 2,
    drawWidth,
    drawHeight
  );

  // Reading a third-party image without CORS permission can taint the canvas.
  // In that case the caller keeps the original image as the visual fallback.
  const texture = textureContext.getImageData(0, 0, textureWidth, textureHeight);
  const output = outputContext.createImageData(size, size);

  const lightLength = Math.hypot(-0.42, 0.62, 0.66);
  const lx = -0.42 / lightLength;
  const ly = 0.62 / lightLength;
  const lz = 0.66 / lightLength;
  const halfLength = Math.hypot(lx, ly, lz + 1);
  const hx = lx / halfLength;
  const hy = ly / halfLength;
  const hz = (lz + 1) / halfLength;

  for (let y = 0; y < size; y += 1) {
    const ny = 1 - ((y + 0.5) / size) * 2;
    for (let x = 0; x < size; x += 1) {
      const nx = ((x + 0.5) / size) * 2 - 1;
      const radiusSquared = nx * nx + ny * ny;
      if (radiusSquared > 1) continue;

      const nz = Math.sqrt(1 - radiusSquared);
      const u = 0.5 + Math.atan2(nx, nz) / Math.PI;
      const v = 0.5 - Math.asin(ny) / Math.PI;
      const textureX = ((Math.floor(u * textureWidth) % textureWidth) + textureWidth) % textureWidth;
      const textureY = Math.min(textureHeight - 1, Math.max(0, Math.floor(v * textureHeight)));
      const sourceIndex = (textureY * textureWidth + textureX) * 4;
      const targetIndex = (y * size + x) * 4;

      const diffuse = Math.max(0, nx * lx + ny * ly + nz * lz);
      const specular = Math.pow(Math.max(0, nx * hx + ny * hy + nz * hz), 48) * 0.055;
      const edgeShade = Math.pow(1 - nz, 2.2);
      const illumination = (0.72 + diffuse * 0.37) * (1 - edgeShade * 0.10) - edgeShade * 0.025;
      const edgeCoverage = Math.min(1, Math.max(0, (1 - Math.sqrt(radiusSquared)) * size / 2));
      const alpha = (texture.data[sourceIndex + 3] / 255) * edgeCoverage;

      output.data[targetIndex] = Math.min(255, texture.data[sourceIndex] * illumination + 255 * specular);
      output.data[targetIndex + 1] = Math.min(255, texture.data[sourceIndex + 1] * illumination + 255 * specular);
      output.data[targetIndex + 2] = Math.min(255, texture.data[sourceIndex + 2] * illumination + 255 * specular);
      output.data[targetIndex + 3] = Math.round(alpha * 255);
    }
  }

  canvas.width = size;
  canvas.height = size;
  outputContext.clearRect(0, 0, size, size);
  outputContext.putImageData(output, 0, 0);
  return true;
}

export function MaterialSphere({
  src,
  alt,
  className = "",
  loading = "lazy",
}: MaterialSphereProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    const image = imageRef.current;
    const canvas = canvasRef.current;
    if (!image || !canvas) return;

    let cancelled = false;
    setRendered(false);

    const draw = () => {
      if (cancelled || !image.complete || !image.naturalWidth) return;
      try {
        const success = renderMaterialSphere(image, canvas);
        if (!cancelled) setRendered(success);
      } catch {
        if (!cancelled) setRendered(false);
      }
    };
    const failed = () => {
      if (!cancelled) setRendered(false);
    };

    image.addEventListener("load", draw);
    image.addEventListener("error", failed);
    if (image.complete && image.naturalWidth) draw();

    return () => {
      cancelled = true;
      image.removeEventListener("load", draw);
      image.removeEventListener("error", failed);
    };
  }, [src]);

  return (
    <span
      className={"idea-material-sphere-render " + className}
      data-rendered={rendered ? "true" : "false"}
    >
      <img ref={imageRef} src={src} alt={alt} loading={loading} decoding="async" />
      <canvas aria-hidden="true" ref={canvasRef} />
    </span>
  );
}
