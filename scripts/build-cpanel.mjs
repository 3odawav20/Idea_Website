import { execFileSync } from "node:child_process";
import { copyFile, mkdir, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { writeCpanelReleaseManifest } from "./cpanel-release-manifest.mjs";

const root = process.cwd();
const dist = resolve(root, "dist");
const backend = resolve(root, "server/cpanel/api/visualize.php");
const htaccess = resolve(root, "server/cpanel/.htaccess");
await stat(resolve(dist, "index.html"));
await mkdir(resolve(dist, "api"), { recursive: true });
await copyFile(backend, resolve(dist, "api/visualize.php"));
await copyFile(resolve(root, "server/cpanel/api/ask-idea.php"), resolve(dist, "api/ask-idea.php"));
await mkdir(resolve(dist, "data"), { recursive: true });
await copyFile(resolve(root, "src/app/data/artceramic.json"), resolve(dist, "data/idea-catalogue.json"));
await copyFile(htaccess, resolve(dist, ".htaccess"));

const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
await writeCpanelReleaseManifest(dist, sourceCommit);
console.log(`IDEA cPanel package prepared in dist/ for source ${sourceCommit}.`);
console.log("Package status: SOURCE_ONLY; PHP/MySQL accounts and RFQ contracts are not verified or included.");
