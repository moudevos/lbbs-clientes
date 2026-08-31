import { redirect } from "next/navigation";

import { CustomerNav } from "@/components/CustomerNav";
import { customerStatePath, resolveCustomerAuthState } from "@/lib/auth/customer-state";
import { requireCustomerUser } from "@/lib/auth/customer-session";

type Profile = { firstName: string; lastName: string; email: string | null; documentType: string; documentNumberMasked: string; phone: string; attentions: number; availableRewards: number };

export default async function PerfilPage() {
  const { supabase, user } = await requireCustomerUser();
  if (!user) redirect("/login");
  const state = await resolveCustomerAuthState(supabase);
  if (state !== "ACTIVE") redirect(state === "BLOCKED" ? "/login?error=account_blocked" : customerStatePath(state));
  const { data, error } = await supabase.rpc("get_customer_profile");
  if (error) redirect("/rewards");
  const profile = data as Profile;
  return <main className="customer-shell"><section className="customer-card"><p className="customer-eyebrow">Mi perfil</p><h1 className="customer-title">{profile.firstName} {profile.lastName}</h1><ul className="customer-list"><li><strong>Correo</strong><small>{profile.email ?? user.email}</small></li><li><strong>{profile.documentType}</strong><small>{profile.documentNumberMasked}</small></li><li><strong>Teléfono</strong><small>{profile.phone}</small></li></ul><div className="customer-stat-grid"><div className="customer-stat">Atenciones<strong>{profile.attentions}</strong></div><div className="customer-stat">Rewards<strong>{profile.availableRewards}</strong></div></div></section><CustomerNav /></main>;
}
