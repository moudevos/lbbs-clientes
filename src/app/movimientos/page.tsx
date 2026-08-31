import { redirect } from "next/navigation";

import { CustomerNav } from "@/components/CustomerNav";
import { customerStatePath, resolveCustomerAuthState } from "@/lib/auth/customer-state";
import { requireCustomerUser } from "@/lib/auth/customer-session";
import { MovementsClient } from "./MovementsClient";

export default async function MovimientosPage() {
  const { supabase, user } = await requireCustomerUser();
  if (!user) redirect("/login");
  const state = await resolveCustomerAuthState(supabase);
  if (state !== "ACTIVE") redirect(state === "BLOCKED" ? "/login?error=account_blocked" : customerStatePath(state));
  return <main className="customer-shell"><MovementsClient /><CustomerNav /></main>;
}
