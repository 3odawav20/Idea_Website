import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')
const marketplace = await read('../server/cpanel/api/marketplace.php')
const pricePolicy = await read('../server/cpanel/api/marketplace-price-policy.php')
const requestQuote = await read('../src/app/pages/RequestQuote.tsx')
const productCard = await read('../src/app/components/ProductCard.tsx')
const apiClient = await read('../src/app/backend/apiClient.ts')
const backend = await read('../src/app/backend/db.tsx')
const adminStudio = await read('../src/app/pages/AdminStudio.tsx')
const authValidation = await read('../src/app/backend/authValidation.ts')

 test('private-price policy is limited to a scoped company owner or manager', () => {
  assert.match(marketplace, /mpApplyCataloguePricePolicy\(\$r,\$company,\$companyRole\)/)
  assert.match(pricePolicy, /\$companyId !== '' && in_array\(\$companyRole, \['owner', 'manager'\], true\)/)
  assert.match(pricePolicy, /unset\(\$row\['private_price_cents'\], \$row\['currency'\]\)/)
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

test('RFQ requires an explicitly selected variant and a validated saved response', () => {
  assert.match(requestQuote, /resolveExplicitVariant\(product\.sizes, selectedSizes\[product\.id\]\)/)
  assert.doesNotMatch(requestQuote, /product\.sizes\[0\]/)
  assert.match(requestQuote, /variantId: size\.id/)
  assert.match(requestQuote, /requireSavedId\(persistedRequest\)/)
  assert.match(requestQuote, /removeFromQuote\(product\.id\)/)
  assert.match(requestQuote, /BLOCKED: the verified PHP\/MySQL contract has no RFQ endpoint/)
})

test('RFQ, offers, orders, and billing remain blocked rather than using legacy routes or optimistic records', () => {
  assert.doesNotMatch(backend, /\/api\/requests|\/api\/offers|\/api\/subscriptions|\/api\/orders/)
  assert.doesNotMatch(backend, /id:\s*["']pending["']/)
  assert.match(backend, /createRequest: \(\) => unavailable\("RFQ"\)/)
  assert.match(backend, /submitOffer: \(\) => unavailable\("SUPPLIER_OFFER"\)/)
  assert.match(backend, /acceptOffer: \(\) => unavailable\("ORDER_ACCEPTANCE"\)/)
  assert.match(backend, /subscribe: \(\) => unavailable\("SUBSCRIPTION"\)/)
})

test('only verified PHP/MySQL roles may enter authorization-protected routes', () => {
  assert.match(authValidation, /SafeRole = "buyer" \| "supplier" \| "admin"/)
  assert.doesNotMatch(authValidation, /"designer"|"contractor"/)
})

test('admin overview does not present unverified API records as live RFQ totals', () => {
  assert.match(adminStudio, /title="RFQ records" value="—" sub="Awaiting verified cPanel MySQL API"/)
  assert.doesNotMatch(adminStudio, /db\.requests\.length/)
})

test('API client rejects empty and null success responses and never uses Firebase bearer tokens', () => {
  assert.match(apiClient, /response\.status === 204/)
  assert.match(apiClient, /payload === null/)
  assert.match(apiClient, /PHP_API_ROUTE_NOT_VERIFIED/)
  assert.doesNotMatch(apiClient, /getCurrentIdToken|Authorization\s*=\s*`Bearer/)
})
