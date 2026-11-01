import { copyFile, mkdir, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const dist = resolve(root, "dist");
const backend = resolve(root, "server/cpanel/api/visualize.php");
const htaccess = resolve(root, "server/cpanel/.htaccess");
await stat(resolve(dist, "index.html"));
await mkdir(resolve(dist, "api"), { recursive: true });
await copyFile(backend, resolve(dist, "api/visualize.php"));
await copyFile(htaccess, resolve(dist, ".htaccess"));
console.log("IDEA cPanel package prepared in dist/; PHP must run on an enabled PHP hosting account.");
