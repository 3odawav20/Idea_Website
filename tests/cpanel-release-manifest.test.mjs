import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { verifyCpanelRelease, writeCpanelReleaseManifest } from "../scripts/cpanel-release-manifest.mjs";

const sourceCommit = "a".repeat(40);
const requiredFiles = {
  ".htaccess": "Options -MultiViews\n",
  "api/ask-idea.php": "<?php\n",
  "api/visualize.php": "<?php\n",
  "data/idea-catalogue.json": "[]\n",
  "index.html": "<!doctype html>\n",
};

async function makePackage() {
  const root = await mkdtemp(join(tmpdir(), "idea-cpanel-package-"));
  for (const [path, contents] of Object.entries(requiredFiles)) {
    const target = join(root, path);
    await mkdir(join(target, ".."), { recursive: true });
    await writeFile(target, contents);
  }
  return root;
}

test("release manifest binds a source SHA to an exact file inventory and digest set", async () => {
  const root = await makePackage();
  try {
    const manifest = await writeCpanelReleaseManifest(root, sourceCommit);
    assert.equal(manifest.sourceCommit, sourceCommit);
    assert.equal(manifest.packageStatus, "SOURCE_ONLY");
    assert.equal(manifest.privateRuntimeConfigurationIncluded, false);
    assert.equal(manifest.files.length, Object.keys(requiredFiles).length);
    const verified = await verifyCpanelRelease(root, sourceCommit);
    assert.equal(verified.sourceCommit, sourceCommit);
    await assert.rejects(verifyCpanelRelease(root, "b".repeat(40)), /does not match/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("release verification detects changed package files", async () => {
  const root = await makePackage();
  try {
    await writeCpanelReleaseManifest(root, sourceCommit);
    await writeFile(join(root, "index.html"), "changed after manifest\n");
    await assert.rejects(verifyCpanelRelease(root, sourceCommit), /does not match/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("release package rejects sensitive filenames and requires required assets", async () => {
  const root = await makePackage();
  try {
    await writeFile(join(root, ".env.production"), "NOT_A_SECRET\n");
    await assert.rejects(writeCpanelReleaseManifest(root, sourceCommit), /Disallowed file/);
    await rm(join(root, ".env.production"));
    await rm(join(root, "api/visualize.php"));
    await assert.rejects(writeCpanelReleaseManifest(root, sourceCommit), /Required cPanel package files/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
