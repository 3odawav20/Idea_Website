import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

test('every cached face resolves to its original catalogue source and a decodable image signature', () => {
  const products = JSON.parse(readFileSync('src/app/data/artceramic.json', 'utf8'));
  const cache = JSON.parse(readFileSync('src/app/data/materialFaceCache.json', 'utf8'));
  assert.equal(Object.keys(cache).length, products.length);
  for (const product of products) {
    const sourceHash = createHash('sha256').update(product.tiles[0]).digest('hex').slice(0,24);
    assert.equal(cache[product.id], `/images/material-faces/${sourceHash}.jpg`);
    const bytes = readFileSync('public' + cache[product.id]);
    assert.ok(bytes.length > 100, `empty face for ${product.id}`);
    const jpeg = bytes[0] === 255 && bytes[1] === 216;
    const png = bytes.subarray(1,4).toString() === 'PNG';
    const webp = bytes.subarray(8,12).toString() === 'WEBP';
    assert.ok(jpeg || png || webp, `invalid face for ${product.id}`);
  }
});
