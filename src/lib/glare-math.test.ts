import test from "node:test";
import assert from "node:assert/strict";
import { computeGlareState, INITIAL_GLARE_STATE } from "./glare-math";
import { cn } from "./utils";

test("computeGlareState returns neutral rotation at card center", () => {
  const rect = { left: 100, top: 200, width: 320, height: 400 };
  const result = computeGlareState(260, 400, rect);

  assert.equal(result.glare.x, 50);
  assert.equal(result.glare.y, 50);
  assert.equal(Math.abs(result.rotate.x), 0);
  assert.equal(Math.abs(result.rotate.y), 0);
  assert.equal(result.background.x, 50);
  assert.ok(Math.abs(result.background.y - 50) < 0.01);
});

test("computeGlareState calculates opposite tilt at opposite corners", () => {
  const rect = { left: 0, top: 0, width: 200, height: 200 };
  const topLeft = computeGlareState(0, 0, rect);
  const bottomRight = computeGlareState(200, 200, rect);

  assert.equal(topLeft.glare.x, 0);
  assert.equal(topLeft.glare.y, 0);
  assert.ok(topLeft.rotate.x > 0);
  assert.ok(topLeft.rotate.y < 0);

  assert.equal(bottomRight.glare.x, 100);
  assert.equal(bottomRight.glare.y, 100);
  assert.ok(bottomRight.rotate.x < 0);
  assert.ok(bottomRight.rotate.y > 0);
  assert.ok(Math.abs(topLeft.rotate.x + bottomRight.rotate.x) < 1e-9);
  assert.ok(Math.abs(topLeft.rotate.y + bottomRight.rotate.y) < 1e-9);
});

test("computeGlareState clamps out-of-bounds pointer coordinates and guards zero rect", () => {
  const rect = { left: 10, top: 10, width: 100, height: 100 };
  const clamped = computeGlareState(500, -100, rect);
  assert.equal(clamped.glare.x, 100);
  assert.equal(clamped.glare.y, 0);

  const zeroRect = computeGlareState(50, 50, { left: 0, top: 0, width: 0, height: 0 });
  assert.deepEqual(zeroRect, INITIAL_GLARE_STATE);
});

test("cn merges conflicting Tailwind utilities cleanly", () => {
  assert.equal(cn("px-4 py-2", "px-6", false && "hidden", "text-white"), "py-2 px-6 text-white");
});
