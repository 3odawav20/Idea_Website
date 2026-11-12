import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const component=readFileSync("src/app/components/HeroBrandFilm.tsx","utf8");
const styles=readFileSync("src/app/components/HeroBrandFilm.css","utf8");
const home=readFileSync("src/app/pages/Home.tsx","utf8");

test("homepage uses an inline cinematic brand film, not the old slides",()=>{
 assert.match(home,/<HeroBrandFilm \/>/);
 assert.doesNotMatch(home,/<HeroCarousel \/>/);
 assert.match(component,/className="idea-film-video"/);
});
test("both desktop and mobile films use IDEA-owned media URLs",()=>{
 assert.match(component,/\/media\/hero\/idea-owner-20261112\.mp4/);
 assert.match(component,/\/media\/hero\/idea-owner-20261112-mobile\.mp4/);
 assert.match(component,/media="\(max-width: 767px\)"/);
 assert.match(component,/idea-light-porcelain\.webp/);
});
test("both themes use the supplied film with theme-specific image fallbacks",()=>{
 assert.match(component,/mode === "dark"/);
 assert.match(component,/idea-dark-porcelain\.webp/);
 assert.match(component,/idea-dark-marble\.webp/);
 assert.match(component,/key=\{mode\}/);
 assert.match(component,/onEnded=\{\(\) => setActiveSlide\(1\)\}/);
 assert.doesNotMatch(styles,/url\(/);
});
test("decorative film is a silent autoplay looping background with no controls",()=>{
 for(const attr of ["autoPlay","muted","loop","playsInline","disablePictureInPicture","disableRemotePlayback"])
   assert.match(component,new RegExp("\\b"+attr+"\\b"));
 assert.match(component,/controls=\{false\}/);
 assert.match(styles,/pointer-events:none!important/);
});
test("film has poster/reduced-motion fallbacks and pauses offscreen",()=>{
 assert.match(component,/prefers-reduced-motion: reduce/);
 assert.match(component,/IntersectionObserver/);
 assert.match(component,/visibilitychange/);
 assert.match(styles,/prefers-reduced-motion:reduce/);
 assert.match(styles,/idea-film-poster/);
});
