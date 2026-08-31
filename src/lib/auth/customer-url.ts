const DEV_CUSTOMER_URL = "http://clientes.localhost:3001";
const PROD_CUSTOMER_URL = "https://clientes.labajaditabarberstudio.com";
export function getCustomerAppUrl() { const configured = process.env.NEXT_PUBLIC_CUSTOMER_APP_URL?.trim().replace(/\/$/, ""); return configured || (process.env.NODE_ENV === "production" ? PROD_CUSTOMER_URL : DEV_CUSTOMER_URL); }
const safePaths = new Set(["/login", "/registro", "/vincular", "/rewards"]);
export function getSafeCustomerRedirect(value: string | null | undefined, fallback = "/rewards") { if (!value) return fallback; try { const url = new URL(value, getCustomerAppUrl()); return url.origin === getCustomerAppUrl() && safePaths.has(url.pathname) ? `${url.pathname}${url.search}` : fallback; } catch { return fallback; } }
