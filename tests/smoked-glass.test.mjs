import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const css=readFileSync("public/assets/idea-smoked-glass-20261124.css","utf8");
test("dark-only smoked glass retains original solid logo footer and panel rims",()=>{
 assert.match(readFileSync("index.html","utf8"),/idea-smoked-glass-20261124\.css/);
 assert.match(css,/\.idea-editorial-footer\s*\{[^}]*backdrop-filter: none !important/);
 assert.match(css,/\.idea-footer-body::before\s*\{[^}]*background: #191919/);
 assert.match(css,/\.idea-footer-bottom\s*\{[^}]*background: #191919/);
 assert.match(css,/\.idea-footer-bottom\s*\{[^}]*border-top:/);
 assert.match(css,/--idea-glass-rim:\s*inset/);
 assert.match(css,/\.idea-glass-tablist,[\s\S]*?box-shadow: var\(--idea-glass-rim\)/);
 assert.doesNotMatch(css,/background-image\s*:|html\[data-theme="light"\]/);
});
