import { test, expect } from "@playwright/test";
import path from "node:path";

test("room upload, custom material, surface selection, compare, download and save work end to end", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/ai-room-visualizer", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "شوف مساحتك بشكل جديد." }),
  ).toBeVisible();
  const studio = page.locator(".idea-ceramic-studio");
  await studio.locator("#mode").selectOption("preview");
  await studio.getByRole("button", { name: "توضيحية", exact: true }).click();
  await studio.locator(".material-card").first().click();
  await studio.getByRole("button", { name: "جرّب الخامة في مساحتك" }).click();
  await expect(studio.locator(".result-image")).toBeVisible();
  const changed = await studio
    .locator(".result-image")
    .evaluate(async (img) => {
      const original = document.querySelector(".room-image");
      const c = document.createElement("canvas");
      c.width = original.naturalWidth;
      c.height = original.naturalHeight;
      const x = c.getContext("2d");
      x.drawImage(original, 0, 0);
      const a = x.getImageData(200, c.height - 20, 1, 1).data;
      x.drawImage(img, 0, 0);
      const b = x.getImageData(200, c.height - 20, 1, 1).data;
      return Array.from(a).some((v, i) => v !== b[i]);
    });
  expect(changed).toBe(true);
  await studio.getByLabel("مقارنة قبل وبعد").fill("75");
  await expect(studio.locator(".result-image")).toHaveAttribute("style", /25%/);
  const download = page.waitForEvent("download");
  await studio.getByRole("button", { name: "تنزيل", exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/idea-preview.*png/);
  await studio.getByRole("button", { name: "حفظ", exact: true }).click();
  await expect(studio.getByRole("status")).toContainText("تم حفظ التصميم");
  await studio.getByRole("button", { name: "تصميماتي", exact: true }).click();
  await expect(studio.locator(".saved-item")).toHaveCount(1);
  await studio.getByRole("button", { name: "إغلاق", exact: true }).click();
  await studio
    .locator("input[type=file]")
    .first()
    .setInputFiles(path.resolve("public/ceramic-studio/room.png"));
  await expect(studio.locator(".edit-hint")).toBeVisible();
  const stage = studio.locator(".stage");
  const box = await stage.boundingBox();
  for (const [x, y] of [
    [0.08, 0.82],
    [0.72, 0.82],
    [0.8, 0.97],
    [0.02, 0.97],
  ])
    await stage.click({ position: { x: x * box.width, y: y * box.height } });
  await expect(studio.locator(".edit-hint")).toHaveCount(0);
  await studio
    .locator("input[type=file]")
    .nth(1)
    .setInputFiles({
      name: "my-ceramic.png",
      mimeType: "image/png",
      buffer: await page.locator(".material-card").first().screenshot(),
    });
  await expect(
    studio.getByRole("heading", { name: "my-ceramic", exact: true }),
  ).toBeVisible();
  await studio.getByRole("button", { name: "جرّب الخامة في مساحتك" }).click();
  await expect(studio.locator(".result-image")).toBeVisible();
  await studio.locator("#mode").selectOption("ai");
  await studio.getByRole("button", { name: "ولّد تصميمك" }).click();
  await expect(studio.getByRole("status")).toContainText("سجّل الدخول");
  expect(errors).toEqual([]);
  await page.screenshot({
    path: "artifacts/studio-desktop.png",
    fullPage: true,
  });
});

test("catalogue product is selected by URL and mobile layout fits viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ai-room-visualizer?product=95", {
    waitUntil: "domcontentloaded",
  });
  const studio = page.locator(".idea-ceramic-studio");
  await expect(
    studio.getByRole("heading", { name: "Manila", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await studio.getByRole("button", { name: "عرض موسّع" }).click();
  await expect(studio.getByRole("dialog")).toBeVisible();
  await studio.getByRole("button", { name: "إغلاق", exact: true }).click();
  await page.screenshot({
    path: "artifacts/studio-mobile.png",
    fullPage: true,
  });
});

test("invalid upload is rejected and existing room designer remains accessible", async ({
  page,
}) => {
  await page.goto("/ceramic-studio", { waitUntil: "domcontentloaded" });
  await page
    .locator(".studio input[type=file]")
    .first()
    .setInputFiles({
      name: "bad.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("not an image"),
    });
  await expect(page.locator(".studio").getByRole("status")).toContainText(
    "JPG",
  );
  await page.goto("/room-designer/new", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".idea-editor")).toBeVisible();
});

test("AI upload uses automatic surface selection and selecting a store product requests authentication", async ({
  page,
}) => {
  await page.goto("/ai-room-visualizer", { waitUntil: "domcontentloaded" });
  const studio = page.locator(".idea-ceramic-studio");
  await expect(studio.locator("#mode")).toHaveValue("ai");
  await studio
    .locator("input[type=file]")
    .first()
    .setInputFiles(path.resolve("public/ceramic-studio/room.png"));
  await expect(studio.getByRole("status")).toContainText("صورتك جاهزة");
  await expect(studio.locator(".edit-hint")).toHaveCount(0);
  await studio.locator(".material-card").first().click();
  await expect(studio.getByRole("status")).toContainText("سجّل الدخول");
});
