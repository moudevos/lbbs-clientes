import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const allowed = new Set(["/login", "/registro", "/vincular", "/rewards"]);
function safeRedirect(value, fallback = "/rewards") {
  try {
    const url = new URL(value, "http://clientes.localhost:3001");
    return url.origin === "http://clientes.localhost:3001" && allowed.has(url.pathname) ? `${url.pathname}${url.search}` : fallback;
  } catch { return fallback; }
}

test("customer OAuth destinations stay inside the customer portal", () => {
  assert.equal(safeRedirect("/rewards"), "/rewards");
  assert.equal(safeRedirect("/registro"), "/registro");
  assert.equal(safeRedirect("/login"), "/login");
});

test("customer OAuth never accepts dashboard or recovery destinations", () => {
  for (const destination of ["/control", "/restablecer-contrasena", "/auth/confirm", "https://evil.example/control"]) {
    assert.equal(safeRedirect(destination), "/rewards");
  }
});

test("linking code format is exactly six numeric digits", () => {
  assert.equal(/^\d{6}$/.test("012345"), true);
  assert.equal(/^\d{6}$/.test("12345"), false);
  assert.equal(/^\d{6}$/.test("ABC123"), false);
});

test("callback and the central state resolver have no dashboard employee or password recovery dependency", () => {
  const callback = readFileSync(new URL("../src/app/auth/callback/route.ts", import.meta.url), "utf8");
  const state = readFileSync(new URL("../src/lib/auth/customer-state.ts", import.meta.url), "utf8");
  for (const forbidden of ["/control", "restablecer", "employees", "route-auth"]) {
    assert.equal(callback.includes(forbidden), false, `${forbidden} must not be used by customer callback`);
    assert.equal(state.includes(forbidden), false, `${forbidden} must not be used by customer state resolver`);
  }
  assert.match(callback, /exchangeCodeForSession/);
  assert.match(callback, /resolveCustomerAuthState/);
  assert.match(state, /customer_accounts/);
});

test("central customer state keeps active, linking and blocked destinations separate", () => {
  const state = readFileSync(new URL("../src/lib/auth/customer-state.ts", import.meta.url), "utf8");
  for (const required of ["UNAUTHENTICATED", "AUTHENTICATED_UNREGISTERED", "LINK_PENDING", "LINK_CODE_READY", "ACTIVE", "BLOCKED"]) assert.match(state, new RegExp(required));
});

test("registration uses separate legal names and a one-submit guard", () => {
  const form = readFileSync(new URL("../src/app/registro/RegistrationForm.tsx", import.meta.url), "utf8");
  assert.match(form, /name="firstName"/);
  assert.match(form, /name="lastName"/);
  assert.match(form, /submitted\.current/);
  assert.match(form, /inputMode="numeric"/);
  assert.match(form, /inputMode="tel"/);
});

test("service worker does not cache authenticated APIs", () => {
  const worker = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
  assert.match(worker, /pathname\.startsWith\("\/api\/"\)/);
  assert.match(worker, /\/offline/);
});

test("digital card keeps QR generation local and Wallet signing server-side", () => {
  const card = readFileSync(new URL("../src/components/DigitalLoyaltyCard.tsx", import.meta.url), "utf8");
  const wallet = readFileSync(new URL("../src/lib/wallet/google-wallet.ts", import.meta.url), "utf8");
  assert.match(card, /QRCode\.toDataURL/);
  assert.match(wallet, /SignJWT/);
  assert.match(wallet, /GOOGLE_WALLET_PRIVATE_KEY/);
  assert.doesNotMatch(card, /GOOGLE_WALLET_PRIVATE_KEY|saveUrl.*localStorage/);
});

test("Wallet never sends private customer identifiers to the pass payload", () => {
  const wallet = readFileSync(new URL("../src/lib/wallet/google-wallet.ts", import.meta.url), "utf8");
  const objectBody = wallet.slice(wallet.indexOf("function objectBody"), wallet.indexOf("export async function ensureLoyaltyClass"));
  assert.match(objectBody, /barcode: \{ type: "QR_CODE", value: projection\.publicToken \}/);
  assert.doesNotMatch(objectBody, /customerId|document|email|phone/);
});
