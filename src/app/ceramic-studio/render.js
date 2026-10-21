export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const i = new Image();
    if (/^https?:/.test(src)) i.crossOrigin = "anonymous";
    i.onload = () => resolve(i);
    i.onerror = () => {
      if (/^https?:/.test(src) && !i.dataset.retried) {
        i.dataset.retried = "true";
        i.src = `${import.meta.env.VITE_MATERIAL_ENDPOINT || `${import.meta.env.BASE_URL}api/material.php`}?url=${encodeURIComponent(src)}`;
      } else
        reject(
          new Error(
            "تعذر قراءة صورة الخامة من مصدر الكتالوج. ارفع صورتها كملف JPG أو PNG أو WebP.",
          ),
        );
    };
    i.src = src;
  });
}
export async function imageData(src) {
  const i = await loadImage(src);
  const c = document.createElement("canvas");
  const s = Math.min(1, 1600 / Math.max(i.width, i.height));
  c.width = Math.round(i.width * s);
  c.height = Math.round(i.height * s);
  c.getContext("2d").drawImage(i, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.92);
}
export async function readUpload(file) {
  if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("اختَر صورة JPG أو PNG أو WebP.");
  if (file.size > 10 * 1024 * 1024)
    throw new Error("حجم الصورة أكبر من 10 ميجابايت.");
  const data = await new Promise((r, j) => {
    const f = new FileReader();
    f.onload = () => r(f.result);
    f.onerror = () => j(new Error("تعذر فتح الملف."));
    f.readAsDataURL(file);
  });
  return imageData(data);
}
// Bilinear mapping into four user-selected corners. This is a local material study,
// not semantic segmentation or a photorealistic AI render.
export async function renderMaterial(
  room,
  material,
  points,
  size,
  angle,
  grout,
) {
  const [r, m] = await Promise.all([loadImage(room), loadImage(material)]);
  const c = document.createElement("canvas");
  c.width = r.width;
  c.height = r.height;
  const x = c.getContext("2d");
  x.drawImage(r, 0, 0);
  const t = document.createElement("canvas");
  t.width = 800;
  t.height = 800;
  const tx = t.getContext("2d");
  const dimensions = size.split("×").map(Number);
  const tile = Math.min(300, Math.max(50, dimensions[0] * 2.3));
  const tileHeight = (tile * dimensions[1]) / dimensions[0];
  tx.fillStyle = grout;
  tx.fillRect(0, 0, 800, 800);
  tx.save();
  tx.translate(400, 400);
  tx.rotate((angle * Math.PI) / 180);
  for (let y = -800; y < 800; y += tileHeight)
    for (let z = -800; z < 800; z += tile)
      tx.drawImage(m, z + 1, y + 1, tile - 2, tileHeight - 2);
  tx.restore();
  const p = points.map(([a, b]) => [a * c.width, b * c.height]);
  const at = (u, v) => [
    (1 - u) * (1 - v) * p[0][0] +
      u * (1 - v) * p[1][0] +
      u * v * p[2][0] +
      (1 - u) * v * p[3][0],
    (1 - u) * (1 - v) * p[0][1] +
      u * (1 - v) * p[1][1] +
      u * v * p[2][1] +
      (1 - u) * v * p[3][1],
  ];
  function tri(s, d) {
    const [a, b, k] = s;
    const [A, B, K] = d;
    const den =
      a[0] * (b[1] - k[1]) + b[0] * (k[1] - a[1]) + k[0] * (a[1] - b[1]);
    if (Math.abs(den) < 0.00001) return;
    const f = (q) => [
      (q[0] * (b[1] - k[1]) + q[1] * (k[1] - a[1]) + q[2] * (a[1] - b[1])) /
        den,
      (q[0] * (k[0] - b[0]) + q[1] * (a[0] - k[0]) + q[2] * (b[0] - a[0])) /
        den,
      (q[0] * (b[0] * k[1] - k[0] * b[1]) +
        q[1] * (k[0] * a[1] - a[0] * k[1]) +
        q[2] * (a[0] * b[1] - b[0] * a[1])) /
        den,
    ];
    const h = f([A[0], B[0], K[0]]),
      v = f([A[1], B[1], K[1]]);
    x.save();
    x.beginPath();
    d.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b)));
    x.closePath();
    x.clip();
    x.transform(h[0], v[0], h[1], v[1], h[2], v[2]);
    x.drawImage(t, 0, 0);
    x.restore();
  }
  const n = 20;
  for (let a = 0; a < n; a++)
    for (let b = 0; b < n; b++) {
      const u = a / n,
        v = b / n,
        U = (a + 1) / n,
        V = (b + 1) / n;
      tri(
        [
          [u * 800, v * 800],
          [U * 800, v * 800],
          [U * 800, V * 800],
        ],
        [at(u, v), at(U, v), at(U, V)],
      );
      tri(
        [
          [u * 800, v * 800],
          [U * 800, V * 800],
          [u * 800, V * 800],
        ],
        [at(u, v), at(U, V), at(u, V)],
      );
    }
  return c.toDataURL("image/png");
}
