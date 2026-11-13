import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css=readFileSync("src/app/pages/AccountEntry.css","utf8");
const form=readFileSync("src/app/pages/AccountEntry.tsx","utf8");
const routes=readFileSync("src/app/pages/Auth.tsx","utf8");

test("real premium glass form is shared across all account roles",()=>{
  assert.match(css,/IDEA REAL GLASS ACCOUNT FORM -- 2026-11-13/);
  assert.match(css,/\.idea-auth-scene \.idea-auth-panel\s*\{[\s\S]*?backdrop-filter:blur\(26px\)/);
  assert.match(css,/\.idea-auth-scene \.idea-auth-input-wrap\s*\{[\s\S]*?backdrop-filter:blur\(12px\)/);
  assert.match(css,/\.idea-auth-scene \.idea-auth-panel-wrap::before\s*\{/);
  for(const type of ["customer","business","admin"]) {
    assert.ok(css.includes(".idea-auth-scene--"+type),type+" theme remains supported");
    assert.match(form,new RegExp('Audience = "customer" \\| "business" \\| "admin"'));
  }
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/focus-visible/);
});
test("admin office remains photographic, behind interactive form rather than screenshot",()=>{
  assert.match(css,/\.idea-auth-scene--admin \.idea-auth-content\s*\{[\s\S]*?grid-template-columns:minmax\(0,1fr\)/);
  assert.match(css,/\.idea-auth-scene--admin \.idea-auth-visual\s*\{[\s\S]*?grid-column:1 \/ -1/);
  assert.match(css,/\.idea-auth-scene--admin \.idea-auth-panel-wrap\s*\{[\s\S]*?grid-column:2/);
  assert.match(css,/\.idea-auth-scene--admin \.idea-auth-copy\s*\{[\s\S]*?backdrop-filter:blur\(13px\)/);
  assert.match(css,/\.idea-auth-scene--admin \.idea-auth-photo\s*\{[\s\S]*?background-size:cover/);
});
test("editable email, password, submit and real account-route handlers are preserved",()=>{
  assert.match(form,/<form className="idea-auth-panel" onSubmit=/);
  assert.match(form,/<input id="auth-password"/);
  assert.match(form,/<button className="idea-auth-submit" type="submit"/);
  assert.match(form,/<span className="idea-auth-input-wrap">/);
  assert.match(routes,/export function Login\(\) \{ return <AccountEntry audience="customer" mode="login"/);
  assert.match(routes,/export function RegisterBusiness\(\) \{ return <AccountEntry audience="business" mode="register"/);
  assert.match(routes,/export function AdminLogin\(\) \{ return <AccountEntry audience="admin" mode="login"/);
});
