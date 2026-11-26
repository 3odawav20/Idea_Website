import { stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const dist = resolve(root, "dist");
await stat(resolve(dist, "index.html"));
await stat(resolve(dist, "assets"));
await stat(resolve(root, "server/cpanel/api/social-auth.php"));
await stat(resolve(root, "server/cpanel/api/.htaccess"));
console.log("IDEA cPanel frontend package prepared in dist/. PHP APIs, MySQL data and routing remain host-managed and are never bundled into the frontend release.");
