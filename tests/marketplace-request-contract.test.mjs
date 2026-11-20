import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')
const marketplace = await read('../server/cpanel/api/marketplace.php')
const requestQuote = await read('../src/app/pages/RequestQuote.tsx')
const productCard = await read('../src/app/components/ProductCard.tsx')
const apiClient = await read('../src/app/backend/apiClient.ts')
const adminStudio = await read('../src/app/pages/AdminStudio.tsx')

test('public catalogue rows omit private supplier prices', () => {
  assert.match(marketplace, /\$canViewPrivatePrices=\$isAdmin\|\|in_array\(\$companyRole,\['owner','manager'\],true\);/)
  assert.match(marketplace, /if\(!\$canViewPrivatePrices\)unset\(\$r\['private_price_cents'\],\$r\['currency'\]\);/)
  assert.doesNotMatch(productCard, /private_price_cents|unitPrice|price_cents/)
  assert.match(productCard, /t\("price\.hidden"\)/)
})

test('company editing and sales access require an authorized company role', () => {
  assert.match(marketplace, /function mpNeedCompanyEditor\(array \$u,string \$companyId\): string/)
  assert.match(marketplace, /\['admin','owner','manager'\]/)
  for (const action of ['product-save', 'product-active', 'ad-request']) {
    assert.match(marketplace, new RegExp(`if\\(\\$action==='${action}'\\)\\{\\s*mpNeedCompanyEditor\\(\\$u,\\$company\\);`))
  }
  assert.match(marketplace, /if\(\$company!==''\)mpNeedCompanyEditor\(\$u,\$company\);/)
})

test('RFQ preserves the selected exact size and only clears each item after server success', () => {
  assert.match(requestQuote, /const sizeId = selectedSizes\[product\.id\] \?\? product\.sizes\[0\]\?\.id/)
  assert.match(requestQuote, /size\?\.originalSourceValue \|\| size\?\.label/)
  assert.match(requestQuote, /await api\.createRequest\(/)
  assert.match(requestQuote, /removeFromQuote\(product\.id\)/)
  assert.match(requestQuote, /await refresh\(\)/)
  assert.match(requestQuote, /Your products remain in the list/)
})

test('admin overview does not present unverified API records as live RFQ totals', () => {
  assert.match(adminStudio, /title="RFQ records" value="—" sub="Awaiting verified cPanel MySQL API"/)
  assert.doesNotMatch(adminStudio, /db\\.requests\\.length/)
})

test('API client rejects successful non-JSON fallback pages instead of treating them as writes', () => {
  assert.match(apiClient, /Unexpected non-JSON API response/)
  assert.ok(apiClient.includes("response.status === 204"))
})
