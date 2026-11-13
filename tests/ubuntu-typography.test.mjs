import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const fonts = readFileSync("src/styles/fonts.css", "utf8");
const stylesheet = readFileSync("src/styles/index.css", "utf8");
const styles = readFileSync("src/styles/globals.css", "utf8");
const header = readFileSync("src/app/components/Header.css", "utf8");
const film = readFileSync("src/app/components/HeroBrandFilm.tsx", "utf8");

test("Google Ubuntu is the requested Latin font; Arabic Cairo stays supported", () => {
  // A remote font stylesheet must be first in the root import chain, before
  // AstraUI and local CSS. Importing it inside fonts.css can trigger PostCSS
  // '@import must precede other statements' after Vite flattens imports.
  assert.match(stylesheet, /fonts\.googleapis\.com\/css2\?family=(?:Audiowide&family=)?Ubuntu/);
  assert.match(stylesheet, /family=Audiowide/);
  assert.ok(stylesheet.indexOf("fonts.googleapis.com") < stylesheet.indexOf("@figma/astraui"));
  assert.doesNotMatch(fonts, /fonts\.googleapis\.com/);
  assert.match(fonts, /import '\.\/cairo\.css'/);
  assert.match(styles, /--idea-font-display: 'Ubuntu'/);
  assert.match(styles, /--idea-font-body: 'Ubuntu'/);
  assert.match(styles, /html\[lang="fr"\] body/);
  assert.match(styles, /html\[lang="ar"\] body, html\[lang="ar"\] body \*/);
  assert.doesNotMatch(styles, /font-weight:\s*100\s*!important/);
});

test("Localized controls and headings can reflow without text overflow", () => {
  assert.match(styles, /overflow-wrap: anywhere/);
  assert.match(styles, /white-space: normal/);
  assert.match(styles, /text-wrap: balance/);
  assert.match(styles, /min-width: 0/);
  assert.match(styles, /max-width: 100%/);
});

test("The hero remains the owner's genuine video directly below the compact header", () => {
  assert.match(header, /\.idea-reference-header--home\{margin-bottom:0\}/);
  assert.match(header, /--idea-header-height:52px/);
  assert.match(film, /idea-owner-20261112\.mp4/);
  assert.match(film, /idea-owner-20261112-mobile\.mp4/);
  assert.match(film, /autoPlay/);
  assert.match(film, /muted/);
  assert.match(film, /playsInline/);
});
