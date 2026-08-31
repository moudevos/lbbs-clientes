import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { getCustomerAppUrl } from "@/lib/auth/customer-url";
import { customerStatePath, resolveCustomerAuthState } from "@/lib/auth/customer-state";

function devLog(message: string) { if (process.env.NODE_ENV !== "production") console.info(`[customer/oauth] ${message}`); }

export async function GET(request: Request) {
  devLog("callback received");
  const requestUrl = new URL(request.url);
  const response = NextResponse.redirect(new URL("/login?error=oauth_callback", getCustomerAppUrl()));
  const code = requestUrl.searchParams.get("code");
  if (!code) return response;
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.headers.get("cookie")?.split("; ").filter(Boolean).map((entry) => { const [name, ...parts] = entry.split("="); return { name, value: parts.join("=") }; }) ?? [],
      setAll: (items) => items.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  });
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return response;
  devLog("session exchanged");
  const state = await resolveCustomerAuthState(supabase);
  const found = state === "ACTIVE";
  devLog(`account found: ${found}`);
  const destination = state === "BLOCKED" ? "/login?error=account_blocked" : customerStatePath(state);
  devLog(`redirect: ${destination}`);
  response.headers.set("location", new URL(destination, getCustomerAppUrl()).toString());
  return response;
}
