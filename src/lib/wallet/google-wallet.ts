import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { importPKCS8, SignJWT } from "jose";

import { getCustomerAppUrl } from "@/lib/auth/customer-url";
import { createServiceClient } from "@/lib/supabase/service";

const GOOGLE_SCOPE = "https://www.googleapis.com/auth/wallet_object.issuer";
const API_ROOT = "https://walletobjects.googleapis.com/walletobjects/v1";

export type WalletProjection = { customerName: string; publicToken: string; memberId: string; attentions: number; availableRewards: number; nextRewardName?: string | null; remaining?: number | null; lastVisits: Array<{ date: string; services: string }> };

function setting(name: string) { return process.env[name]?.trim(); }
function privateKey() { return setting("GOOGLE_WALLET_PRIVATE_KEY")?.replace(/\\n/g, "\n"); }

export function isGoogleWalletConfigured() {
  return Boolean(setting("GOOGLE_WALLET_CLIENT_EMAIL") && privateKey() && setting("GOOGLE_WALLET_ISSUER_ID") && setting("GOOGLE_WALLET_CLASS_SUFFIX"));
}

function classId() { return `${setting("GOOGLE_WALLET_ISSUER_ID")}.${setting("GOOGLE_WALLET_CLASS_SUFFIX")}`; }
function originHost() { return new URL(getCustomerAppUrl()).host; }

async function signedGoogleAssertion(audience: string, payload: Record<string, unknown> = {}) {
  const key = await importPKCS8(privateKey()!, "RS256");
  return new SignJWT(payload).setProtectedHeader({ alg: "RS256", typ: "JWT", kid: setting("GOOGLE_WALLET_PRIVATE_KEY_ID") }).setIssuer(setting("GOOGLE_WALLET_CLIENT_EMAIL")!).setAudience(audience).setIssuedAt().setExpirationTime("1h").sign(key);
}

async function accessToken() {
  const assertion = await signedGoogleAssertion("https://oauth2.googleapis.com/token", { scope: GOOGLE_SCOPE });
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }) });
  if (!response.ok) throw new Error(`Google Wallet OAuth falló (${response.status}).`);
  const data = await response.json() as { access_token?: string };
  if (!data.access_token) throw new Error("Google Wallet no devolvió un access token.");
  return data.access_token;
}

async function walletRequest(path: string, init: RequestInit = {}) {
  const token = await accessToken();
  const response = await fetch(`${API_ROOT}${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init.headers } });
  return response;
}

function appLinkData() {
  return { webAppLinkInfo: { appTarget: { targetUri: { uri: `${getCustomerAppUrl()}/rewards`, description: "Portal de Rewards LBBS" } } }, displayText: { defaultValue: { language: "es-PE", value: "Abrir mis Rewards" } } };
}

function objectBody(objectId: string, projection: WalletProjection) {
  const lastVisits = Array.isArray(projection.lastVisits) ? projection.lastVisits.slice(0, 3).map((visit, index) => ({ id: `visit_${index}`, header: "Última atención", body: `${visit.date} — ${visit.services}` })) : [];
  return { id: objectId, classId: classId(), state: "ACTIVE", accountName: projection.customerName, accountId: projection.memberId, loyaltyPoints: { label: "Visitas", balance: { int: Math.max(0, Math.trunc(projection.attentions)) } }, secondaryLoyaltyPoints: { label: "Rewards", balance: { int: Math.max(0, Math.trunc(projection.availableRewards)) } }, barcode: { type: "QR_CODE", value: projection.publicToken }, textModulesData: [{ id: "progress", header: "Próximo Reward", body: projection.nextRewardName ? `${projection.remaining ?? 0} visita(s) para ${projection.nextRewardName}` : "Consulta tus beneficios en el portal." }, ...lastVisits], appLinkData: appLinkData() };
}

export async function ensureLoyaltyClass() {
  const id = classId();
  const existing = await walletRequest(`/loyaltyClass/${encodeURIComponent(id)}`);
  if (existing.ok) { console.info("[wallet] class ensured"); return id; }
  if (existing.status !== 404) throw new Error(`No se pudo verificar LoyaltyClass (${existing.status}).`);
  const response = await walletRequest("/loyaltyClass", { method: "POST", body: JSON.stringify({ id, issuerName: "La Bajadita", programName: "La Bajadita Rewards", programLogo: { sourceUri: { uri: setting("GOOGLE_WALLET_LOGO_URL") || `${getCustomerAppUrl()}/icon.svg` }, contentDescription: { defaultValue: { language: "es-PE", value: "La Bajadita Rewards" } } }, accountNameLabel: "Cliente", accountIdLabel: "Socio", reviewStatus: "UNDER_REVIEW", homepageUri: { uri: `${getCustomerAppUrl()}/rewards`, description: "Portal de Rewards LBBS" } }) });
  if (!response.ok) throw new Error(`No se pudo crear LoyaltyClass (${response.status}).`);
  console.info("[wallet] class created");
  return id;
}

async function ensurePass(customerId: string) {
  const supabase = createServiceClient();
  const { data: existing, error } = await supabase.from("wallet_passes").select("external_object_id").eq("customer_id", customerId).eq("provider", "google_wallet").maybeSingle();
  if (error) throw new Error("No se pudo consultar el pase Wallet.");
  if (existing) return existing.external_object_id as string;
  const objectId = `${setting("GOOGLE_WALLET_ISSUER_ID")}.lbbs_${randomBytes(18).toString("hex")}`;
  const { error: insertError } = await supabase.from("wallet_passes").insert({ customer_id: customerId, provider: "google_wallet", external_object_id: objectId, status: "pending" });
  if (!insertError) return objectId;
  const { data: concurrent } = await supabase.from("wallet_passes").select("external_object_id").eq("customer_id", customerId).eq("provider", "google_wallet").single();
  if (!concurrent) throw new Error("No se pudo crear el pase Wallet.");
  return concurrent.external_object_id as string;
}

export async function syncGoogleWalletPass(customerId: string, projection?: WalletProjection) {
  if (!isGoogleWalletConfigured()) return { configured: false as const };
  const supabase = createServiceClient();
  const resolved = projection ?? (await supabase.rpc("get_customer_wallet_projection", { p_customer_id: customerId })).data as WalletProjection;
  if (!resolved?.publicToken) throw new Error("No se pudo generar la proyección Wallet.");
  const objectId = await ensurePass(customerId);
  await ensureLoyaltyClass();
  const body = objectBody(objectId, resolved);
  const existing = await walletRequest(`/loyaltyObject/${encodeURIComponent(objectId)}`);
  const response = existing.status === 404 ? await walletRequest("/loyaltyObject", { method: "POST", body: JSON.stringify(body) }) : existing.ok ? await walletRequest(`/loyaltyObject/${encodeURIComponent(objectId)}`, { method: "PATCH", body: JSON.stringify(body) }) : existing;
  if (!response.ok) {
    const message = `Google Wallet ${existing.status === 404 ? "insert" : "patch"} falló (${response.status}).`;
    await supabase.from("wallet_passes").update({ status: "error", last_error: message, updated_at: new Date().toISOString() }).eq("customer_id", customerId).eq("provider", "google_wallet");
    throw new Error(message);
  }
  const hash = createHash("sha256").update(JSON.stringify(body)).digest("hex");
  await supabase.from("wallet_passes").update({ status: "active", last_synced_at: new Date().toISOString(), last_sync_hash: hash, last_error: null, updated_at: new Date().toISOString() }).eq("customer_id", customerId).eq("provider", "google_wallet");
  console.info(existing.status === 404 ? "[wallet] object created" : "[wallet] object patched");
  return { configured: true as const, objectId, projection: resolved };
}

export async function createGoogleWalletSaveUrl(objectId: string) {
  const token = await signedGoogleAssertion("google", { origins: [originHost()], typ: "savetowallet", payload: { loyaltyObjects: [{ id: objectId }] } });
  return `https://pay.google.com/gp/v/save/${token}`;
}

export function hasValidInternalSecret(value: string | null) {
  const expected = setting("WALLET_SYNC_INTERNAL_SECRET");
  if (!expected || !value) return false;
  const a = Buffer.from(expected); const b = Buffer.from(value);
  return a.length === b.length && timingSafeEqual(a, b);
}
