import { createClient } from "@/lib/supabase/server";

export type CustomerAuthState = "UNAUTHENTICATED" | "AUTHENTICATED_UNREGISTERED" | "LINK_PENDING" | "LINK_CODE_READY" | "ACTIVE" | "BLOCKED";
export async function resolveCustomerAuthState(supabaseClient?: Awaited<ReturnType<typeof createClient>>): Promise<CustomerAuthState> {
  const supabase = supabaseClient ?? await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return "UNAUTHENTICATED";
  const { data: account } = await supabase.from("customer_accounts").select("status").eq("auth_user_id", userData.user.id).maybeSingle();
  if (account?.status === "active") return "ACTIVE";
  if (account?.status === "blocked") return "BLOCKED";
  const { data: link } = await supabase.rpc("get_customer_link_status");
  if (link?.status === "code_generated") return "LINK_CODE_READY";
  if (["pending", "approved"].includes(link?.status)) return "LINK_PENDING";
  return "AUTHENTICATED_UNREGISTERED";
}
export function customerStatePath(state: CustomerAuthState) { if (state === "ACTIVE") return "/rewards"; if (state === "LINK_PENDING" || state === "LINK_CODE_READY") return "/vincular"; return "/registro"; }
