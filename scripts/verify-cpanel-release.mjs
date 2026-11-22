import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { verifyCpanelRelease } from "./cpanel-release-manifest.mjs";

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  const [packageRoot, expectedCommit] = process.argv.slice(2);
  if (!packageRoot || !expectedCommit) {
    throw new Error("Usage: node scripts/verify-cpanel-release.mjs <package-directory> <full-commit-sha>");
  }
  const manifest = await verifyCpanelRelease(packageRoot, expectedCommit);
  process.stdout.write(`IDEA_PACKAGE_VERIFIED=1\nIDEA_PACKAGE_SOURCE_SHA=${manifest.sourceCommit}\nIDEA_PACKAGE_STATUS=${manifest.packageStatus}\n`);
}
