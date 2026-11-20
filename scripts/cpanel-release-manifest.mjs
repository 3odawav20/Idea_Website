import { createHash } from "node:crypto";
import { lstat, readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";

const MANIFEST_NAME = "release-manifest.json";
const REQUIRED_FILES = [
  ".htaccess",
  "api/ask-idea.php",
  "api/visualize.php",
  "data/idea-catalogue.json",
  "index.html",
];
const SENSITIVE_PATH = /(^|\/)(?:\.env(?:\..*)?|\.htpasswd(?:_.*)?|[^/]+\.(?:pem|key|p12|pfx|sql|sqlite|db))$/i;
const COMMIT_SHA = /^[a-f0-9]{40}$/;

function toPosixPath(path) {
  return path.split(sep).join("/");
}

function assertSafePath(path) {
  const normalized = toPosixPath(path);
  if (!normalized || normalized.startsWith("/") || normalized.split("/").some((part) => part === ".." || part === ".")) {
    throw new Error(`Unsafe release path: ${normalized}`);
  }
  if (normalized.includes("\\") || SENSITIVE_PATH.test(normalized)) {
    throw new Error(`Disallowed file in cPanel package: ${normalized}`);
  }
  return normalized;
}

async function listPackageFiles(root, current = root) {
  const entries = await readdir(current, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));
  const files = [];

  for (const entry of entries) {
    const absolutePath = join(current, entry.name);
    const relativePath = assertSafePath(relative(root, absolutePath));
    if (relativePath === MANIFEST_NAME) continue;
    if (entry.isSymbolicLink()) throw new Error(`Symbolic links are not allowed in the cPanel package: ${relativePath}`);
    if (entry.isDirectory()) {
      files.push(...await listPackageFiles(root, absolutePath));
      continue;
    }
    if (!entry.isFile()) throw new Error(`Unsupported filesystem entry in cPanel package: ${relativePath}`);

    const contents = await readFile(absolutePath);
    files.push({
      path: relativePath,
      bytes: contents.byteLength,
      sha256: createHash("sha256").update(contents).digest("hex"),
    });
  }

  return files;
}

function assertRequiredFiles(files) {
  const paths = new Set(files.map((file) => file.path));
  const missing = REQUIRED_FILES.filter((path) => !paths.has(path));
  if (missing.length) throw new Error(`Required cPanel package files are missing: ${missing.join(", ")}`);
}

export async function writeCpanelReleaseManifest(packageRoot, sourceCommit) {
  if (!COMMIT_SHA.test(sourceCommit)) throw new Error("A full 40-character source commit SHA is required.");
  const root = resolve(packageRoot);
  const files = await listPackageFiles(root);
  assertRequiredFiles(files);

  const manifest = {
    schemaVersion: 1,
    sourceCommit,
    packageStatus: "SOURCE_ONLY",
    privateRuntimeConfigurationIncluded: false,
    phpMysqlAccounts: "BLOCKED_UNVERIFIED_PRIVATE_PLATFORM_CONTRACT",
    rfqLifecycle: "BLOCKED_UNVERIFIED_PHP_MYSQL_CONTRACT",
    files,
  };
  await writeFile(join(root, MANIFEST_NAME), `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
  return manifest;
}

export async function verifyCpanelRelease(packageRoot, expectedCommit) {
  if (!COMMIT_SHA.test(expectedCommit)) throw new Error("A full 40-character expected source commit SHA is required.");
  const root = resolve(packageRoot);
  const manifestPath = join(root, MANIFEST_NAME);
  const manifestStat = await lstat(manifestPath);
  if (!manifestStat.isFile() || manifestStat.isSymbolicLink()) throw new Error("Release manifest must be a regular file.");

  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch {
    throw new Error("Release manifest is missing or invalid JSON.");
  }
  if (manifest?.schemaVersion !== 1 || manifest?.sourceCommit !== expectedCommit) {
    throw new Error("Release manifest source commit does not match the expected commit.");
  }
  if (
    manifest.packageStatus !== "SOURCE_ONLY" ||
    manifest.privateRuntimeConfigurationIncluded !== false ||
    manifest.phpMysqlAccounts !== "BLOCKED_UNVERIFIED_PRIVATE_PLATFORM_CONTRACT" ||
    manifest.rfqLifecycle !== "BLOCKED_UNVERIFIED_PHP_MYSQL_CONTRACT" ||
    !Array.isArray(manifest.files)
  ) {
    throw new Error("Release manifest readiness fields are missing or unexpected.");
  }

  const actualFiles = await listPackageFiles(root);
  assertRequiredFiles(actualFiles);
  const expectedFiles = [...manifest.files].sort((a, b) => a.path.localeCompare(b.path));
  if (JSON.stringify(actualFiles) !== JSON.stringify(expectedFiles)) {
    throw new Error("Package file inventory, size, or SHA-256 digest does not match the release manifest.");
  }
  return manifest;
}
