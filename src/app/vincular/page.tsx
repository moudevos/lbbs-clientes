import { redirect } from "next/navigation";
import { LinkingClient } from "./LinkingClient";
import { requireCustomerUser } from "@/lib/auth/customer-session";
import { customerStatePath, resolveCustomerAuthState } from "@/lib/auth/customer-state";

export default async function VincularPage() {
  const { supabase, user } = await requireCustomerUser();
  if (!user) redirect("/login");
  const state = await resolveCustomerAuthState(supabase);
  if (state === "ACTIVE") redirect("/rewards");
  if (state === "BLOCKED") redirect("/login?error=account_blocked");
  if (state === "AUTHENTICATED_UNREGISTERED") redirect(customerStatePath(state));
  return <main className="customer-shell"><LinkingClient /></main>;
}
