import { stat } from "node:fs/promises";
import { resolve } from "node:path";

const dist = resolve(process.cwd(), "dist");
await stat(resolve(dist, "index.html"));
await stat(resolve(dist, "assets"));
console.log("IDEA cPanel frontend package prepared in dist/. PHP APIs, MySQL data and routing remain host-managed and are never bundled into the frontend release.");
