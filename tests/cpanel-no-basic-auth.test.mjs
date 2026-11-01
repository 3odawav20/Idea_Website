import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const apache = readFileSync('server/cpanel/.htaccess', 'utf8');

test('cPanel deployment does not reintroduce site-wide HTTP Basic Auth', () => {
  assert.doesNotMatch(apache, /^\s*(?:AuthType|AuthName|AuthUserFile|Require\s+valid-user)\b/im);
  assert.match(apache, /RewriteRule\s+\^api\/\s+-\s+\[END\]/);
});
