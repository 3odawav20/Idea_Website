import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const page=readFileSync('src/app/pages/AiVisualizerStudio.tsx','utf8');
const css=readFileSync('src/app/pages/AiVisualizerStudio.css','utf8');
const loc=readFileSync('src/app/i18n/i18n.tsx','utf8');
test('AI studio respects locale and protects untranslated product data',()=>{
 assert.match(page,/const localizedName = \(product: Product\)/);
 assert.match(page,/const localizedValue = /);
 assert.match(page,/localizedName\(product\)/);
 assert.match(page,/localizedValue\(selectedProduct.finish/);
 assert.match(page,/lang=\{locale\} dir=\{ar \? "rtl" : "ltr"\}/);
});
test('RTL and mobile typography have explicit wrapping rules',()=>{
 assert.match(css,/Visualizer locale typography and overflow safety/);
 assert.match(css,/idea-studio\[lang="ar"\]/);
 assert.match(css,/overflow-wrap: anywhere/);
 assert.match(css,/@media\(max-width: 680px\)/);
});
test('selected locale persists across routes',()=>{
 assert.match(loc,/localStorage.getItem\("idea-language"\)/);
 assert.match(loc,/localStorage.setItem\("idea-language", locale\)/);
});
