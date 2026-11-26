#!/usr/bin/env node
/**
 * IDEA Website — Mandatory MySQL-Only Architecture Guard
 *
 * Recursively inspects application source code, dependencies, lockfiles,
 * configuration files, deployment scripts, and templates to guarantee zero
 * active Firebase, Supabase, Firestore, or PostgreSQL/Drizzle integrations.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";

const ROOT = process.cwd();
const violations = [];

function reportViolation(filePath, line, reason) {
  violations.push({
    file: relative(ROOT, filePath) || filePath,
    line,
    reason,
  });
}

// 1. Prohibited obsolete files & directories
const PROHIBITED_PATHS = [
  "firebase-applet-config.json",
  "firebase-blueprint.json",
  "firestore.rules",
  "firebase.json",
  ".firebaserc",
  "bun.lock",
  "supabase",
  "utils/supabase",
  "src/app/backend/supabaseClient.ts",
  "src/app/backend/storage.ts",
  "src/lib/firebase-admin.ts",
  "src/middleware/auth.ts",
  "src/db/drizzle.config.ts",
  "src/db/index.ts",
  "src/db/schema.ts",
  "src/db/seed.ts",
  "src/db/users.ts",
  "src/db",
  "server.ts",
  "server/cpanel/api/visualize.php",
  "scripts/catalogue/clean_company_sql.py",
];

for (const relPath of PROHIBITED_PATHS) {
  const fullPath = join(ROOT, relPath);
  if (existsSync(fullPath)) {
    reportViolation(fullPath, 1, `Obsolete prohibited file or directory exists: ${relPath}`);
  }
}

// Required authorized PHP/MySQL visualizer must exist
const AUTHORIZED_VISUALIZER = join(ROOT, "server/cpanel/idea-accounts-api/visualize.php");
if (!existsSync(AUTHORIZED_VISUALIZER)) {
  reportViolation(
    AUTHORIZED_VISUALIZER,
    1,
    "Authorized PHP/MySQL visualizer server/cpanel/idea-accounts-api/visualize.php is missing."
  );
}

// 2. Check the project manifest for prohibited dependencies
const PROHIBITED_PACKAGES = [
  /^firebase$/i,
  /^firebase-admin$/i,
  /^@firebase\//i,
  /^@figma\//i,
  /^@supabase\//i,
  /^supabase$/i,
  /^drizzle-orm$/i,
  /^drizzle-kit$/i,
  /^pg$/i,
  /^postgres$/i,
];

for (const pkgRel of ["package.json"]) {
  const pkgPath = join(ROOT, pkgRel);
  if (!existsSync(pkgPath)) continue;
  try {
    const raw = readFileSync(pkgPath, "utf8");
    const lines = raw.split(/\r?\n/);
    const pkg = JSON.parse(raw);
    for (const section of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
      const deps = pkg[section] || {};
      for (const depName of Object.keys(deps)) {
        if (PROHIBITED_PACKAGES.some((rx) => rx.test(depName))) {
          const lineIdx = lines.findIndex((l) => l.includes(`"${depName}"`));
          reportViolation(
            pkgPath,
            lineIdx >= 0 ? lineIdx + 1 : 1,
            `Prohibited package "${depName}" declared in ${pkgRel} (${section}).`
          );
        }
      }
    }
  } catch (err) {
    reportViolation(pkgPath, 1, `Failed to parse ${pkgRel}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// 3. Check lockfiles for prohibited packages
for (const lockRel of ["pnpm-lock.yaml", "package-lock.json"]) {
  const lockPath = join(ROOT, lockRel);
  if (!existsSync(lockPath)) continue;
  const content = readFileSync(lockPath, "utf8");
  const lines = content.split(/\r?\n/);
  const lockPatterns = [
    { rx: /['"]?@supabase\/supabase-js['"]?:/, reason: "Prohibited @supabase/supabase-js dependency in lockfile." },
    { rx: /['"]?@figma\/[^'"]+['"]?:/, reason: "Retired design SDK dependency in lockfile." },
    { rx: /['"]?@firebase\/eslint-plugin-security-rules['"]?:/, reason: "Prohibited @firebase package in lockfile." },
    { rx: /^\s{2,6}['"]?firebase['"]?:\s*$/, reason: "Prohibited firebase dependency in lockfile." },
    { rx: /['"]?firebase-admin['"]?:/, reason: "Prohibited firebase-admin dependency in lockfile." },
    { rx: /['"]?drizzle-orm['"]?:/, reason: "Prohibited drizzle-orm dependency in lockfile." },
  ];
  for (let i = 0; i < lines.length; i++) {
    for (const pat of lockPatterns) {
      if (pat.rx.test(lines[i])) {
        reportViolation(lockPath, i + 1, pat.reason);
      }
    }
  }
}

// 4. Check .env.example for prohibited environment variables
const envExamplePath = join(ROOT, ".env.example");
if (existsSync(envExamplePath)) {
  const lines = readFileSync(envExamplePath, "utf8").split(/\r?\n/);
  const envProhibited = /^(?:VITE_SUPABASE_|SUPABASE_|IDEA_SUPABASE_|VITE_FIREBASE_|FIREBASE_)/i;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (envProhibited.test(trimmed)) {
      reportViolation(envExamplePath, i + 1, `Prohibited environment variable in .env.example: ${trimmed}`);
    }
  }
}

// 5. Recursively scan executable source & configuration files
const SCAN_DIRS = ["src", "server", "scripts", ".github"];
const ROOT_FILES_TO_SCAN = ["package.json", "vite.config.ts", "tsconfig.json", "vercel.json", ".env.example"];
const TEXT_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".php", ".sh", ".py", ".yml", ".yaml", ".json"]);
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "out", ".php-runtime", "docs", "reports", "tests"]);

const CODE_RULES = [
  {
    rx: /from\s+["']@figma\/[^"']+["']/,
    reason: "Retired design SDK import.",
  },
  {
    rx: /figma:asset\//i,
    reason: "Retired design asset import.",
  },
  {
    rx: /from\s+["'](?:firebase|firebase\/[^"']+|firebase-admin(?:\/[^"']+)?|@firebase\/[^"']+)["']/,
    reason: "Prohibited Firebase SDK import.",
  },
  {
    rx: /from\s+["'](?:@supabase\/[^"']+)["']/,
    reason: "Prohibited Supabase SDK import.",
  },
  {
    rx: /from\s+["'][^"']*supabaseClient(?:\.ts)?["']/,
    reason: "Prohibited import of retired supabaseClient module.",
  },
  {
    rx: /from\s+["'](?:drizzle-orm(?:\/[^"']+)?|drizzle-kit|pg|postgres)["']/,
    reason: "Prohibited PostgreSQL / Drizzle ORM import.",
  },
  {
    rx: /\binitializeApp\s*\(\s*firebaseConfig\b|\bgetFirestore\s*\(/,
    reason: "Prohibited Firebase / Firestore initialization.",
  },
  {
    rx: /\bcreateClient\s*\([^)]*SUPABASE/i,
    reason: "Prohibited Supabase client initialization.",
  },
  {
    rx: /https?:\/\/[a-z0-9-]+\.supabase\.co\b/i,
    reason: "Unauthorized Supabase provider URL.",
  },
  {
    rx: /https?:\/\/firestore\.googleapis\.com\b/i,
    reason: "Unauthorized Firestore provider URL.",
  },
  {
    rx: /\b(?:VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY|IDEA_SUPABASE_URL|IDEA_SUPABASE_ANON_KEY)\b/,
    reason: "Prohibited Supabase environment configuration in executable code.",
  },
  {
    rx: /\b(?:VITE_FIREBASE_[A-Z0-9_]+|FIREBASE_SERVICE_ACCOUNT|FIREBASE_PROJECT_ID)\b/,
    reason: "Prohibited Firebase environment configuration in executable code.",
  },
];

function scanFile(filePath) {
  const rel = relative(ROOT, filePath).replace(/\\/g, "/");
  // Exclude this validator script itself from self-matching rule regexes
  if (rel === "scripts/verify-mysql-only.mjs") return;
  const ext = extname(filePath).toLowerCase();
  if (!TEXT_EXTENSIONS.has(ext)) return;

  let content;
  try {
    content = readFileSync(filePath, "utf8");
  } catch {
    return;
  }

  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    // Skip pure comment lines in code
    if (trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("*")) continue;
    for (const rule of CODE_RULES) {
      if (rule.rx.test(line)) {
        reportViolation(filePath, i + 1, rule.reason);
      }
    }
  }
}

function walkDir(dirPath) {
  if (!existsSync(dirPath)) return;
  for (const entry of readdirSync(dirPath)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dirPath, entry);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walkDir(full);
    } else if (st.isFile()) {
      scanFile(full);
    }
  }
}

for (const d of SCAN_DIRS) {
  walkDir(join(ROOT, d));
}
for (const f of ROOT_FILES_TO_SCAN) {
  const full = join(ROOT, f);
  if (existsSync(full)) scanFile(full);
}

if (violations.length > 0) {
  console.error("IDEA MYSQL-ONLY ARCHITECTURE GUARD FAILED:");
  for (const v of violations) {
    console.error(`  - ${v.file}:${v.line} — ${v.reason}`);
  }
  process.exit(1);
}

console.log("IDEA PROJECT ARCHITECTURE GUARD PASSED: approved PHP/MySQL backend and project dependencies verified.");
