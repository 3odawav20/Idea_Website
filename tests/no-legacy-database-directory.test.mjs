import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
test("obsolete database directory must not return",()=>assert.equal(existsSync("supabase"),false));
