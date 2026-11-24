import { copyFile, mkdir, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const dist = resolve(root, "dist");
const backend = resolve(root, "server/cpanel/api/visualize.php");
const htaccess = resolve(root, "server/cpanel/.htaccess");
await stat(resolve(dist, "index.html"));
await mkdir(resolve(dist, "api"), { recursive: true });
await copyFile(backend, resolve(dist, "api/visualize.php"));
await copyFile(resolve(root, "server/cpanel/api/ask-idea.php"), resolve(dist, "api/ask-idea.php"));
await copyFile(resolve(root, "server/cpanel/api/social-auth.php"), resolve(dist, "api/social-auth.php"));
await copyFile(resolve(root, "server/cpanel/api/marketplace.php"), resolve(dist, "api/marketplace.php"));
await copyFile(resolve(root, "server/cpanel/api/tile-dimensions.php"), resolve(dist, "api/tile-dimensions.php"));
await copyFile(resolve(root, "server/cpanel/api/.htaccess"), resolve(dist, "api/.htaccess"));
await mkdir(resolve(dist, "data"), { recursive: true });
await copyFile(resolve(root, "src/app/data/artceramic.json"), resolve(dist, "data/idea-catalogue.json"));
await copyFile(htaccess, resolve(dist, ".htaccess"));
console.log("IDEA cPanel package prepared in dist/; PHP must run on an enabled PHP hosting account.");
