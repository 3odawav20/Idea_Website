import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

test('all 6 official brand SVG icons exist without text fallback placeholders', () => {
  const icons = read('src/app/components/SocialAuthIcons.tsx');
  for (const fn of [
    'GoogleBrandIcon',
    'MicrosoftBrandIcon',
    'WhatsAppBrandIcon',
    'FacebookBrandIcon',
    'AppleBrandIcon',
    'XBrandIcon',
  ]) {
    assert.ok(icons.includes(`export function ${fn}`), `SocialAuthIcons must export ${fn}`);
  }

  const social = read('src/app/components/SocialAuth.tsx');
  assert.doesNotMatch(social, /item\.id === "x" \? "𝕏" : "M"/, 'SocialAuth must use real SVG icons for X and Microsoft');
  for (const id of ['google', 'microsoft', 'whatsapp', 'facebook', 'apple', 'x']) {
    assert.ok(social.includes(`id: "${id}"`), `SocialAuth must include provider ${id}`);
  }
});

test('AccountEntry uses live PHP/MySQL accounts API and server-verified SocialAuth grid', () => {
  const entry = read('src/app/pages/AccountEntry.tsx');
  assert.match(entry, /authenticatePhp/);
  assert.match(entry, /uploadBusinessDocument/);
  assert.match(entry, /\{isCustomer&&<SocialAuth mode=\{isRegister\?"register":"login"\} redirectTo="\/account"\/>/);
  assert.match(entry, /await authenticatePhp\(isRegister\?"register":"login",payload\)/);
  assert.match(entry, /await uploadBusinessDocument\(file, "commercial_registration"\)/);
  assert.match(entry, /const verifiedSession=await refresh\(\)/);
  assert.match(entry, /verifiedSession\.role!==expectedRole/);
  assert.doesNotMatch(entry, /VITE_IDEA_ACCOUNT_API/);
  assert.doesNotMatch(entry, /idea-apple-mark|idea-google-mark/);
});

test('no Google OAuth client_secret JSON or GOCSPX secret exists in public/ or src/', () => {
  const walk = (dir) => {
    const out = [];
    if (!fs.existsSync(dir)) return out;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === 'dist') continue;
        out.push(...walk(full));
      } else {
        out.push(full);
      }
    }
    return out;
  };

  for (const base of ['public', 'src']) {
    for (const file of walk(path.join(root, base))) {
      assert.doesNotMatch(path.basename(file), /^client_secret.*\.json$/i, `Secret file must not exist in ${base}: ${file}`);
      if (/\.(ts|tsx|js|jsx|json|css|html)$/i.test(file)) {
        const content = fs.readFileSync(file, 'utf8');
        assert.doesNotMatch(content, /GOCSPX-[A-Za-z0-9_-]+/, `OAuth client_secret must not appear in ${file}`);
      }
    }
  }
});
