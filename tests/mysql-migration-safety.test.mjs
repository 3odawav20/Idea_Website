import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const migrationUrl = new URL('../server/cpanel/migrations/20261103_idea_marketplace_mysql.sql', import.meta.url)
const migration = await readFile(migrationUrl, 'utf8')
const sql = migration.replace(/^\s*--.*$/gm, '').trim()

const expectedTables = [
  'idea_company_staff',
  'idea_marketplace_ad_packages',
  'idea_marketplace_ad_requests',
  'idea_marketplace_announcements',
  'idea_marketplace_product_meta',
]

test('MySQL marketplace migration only creates additive sidecar tables', () => {
  const createdTables = [...sql.matchAll(/\bCREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+`?([a-z0-9_]+)`?/gi)]
    .map((match) => match[1])
    .sort()

  assert.deepEqual(createdTables, expectedTables)
  assert.doesNotMatch(sql, /\b(?:ALTER|DROP|TRUNCATE|DELETE\s+FROM|UPDATE)\b/i)

  const statements = sql.split(/;(?=\s*(?:CREATE\s+TABLE|INSERT\s+IGNORE|$))/i)
    .map((statement) => statement.trim())
    .filter(Boolean)
  assert.ok(statements.length > 0)
  assert.ok(statements.every((statement) =>
    /^CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\b/i.test(statement)
    || /^INSERT\s+IGNORE\s+INTO\s+idea_marketplace_ad_packages\b/i.test(statement),
  ))
})

test('default ad package seed rows stay unpublished and idempotent', () => {
  const seedRows = sql.split(/\r?\n/).map((line) => line.trim()).filter((line) => /^\('/.test(line))

  assert.equal(seedRows.length, 3)
  assert.ok(seedRows.every((row) => /,\s*0\s*,\s*0\)[,;]?$/.test(row)))
  assert.match(sql, /INSERT\s+IGNORE\s+INTO\s+idea_marketplace_ad_packages/i)
})
