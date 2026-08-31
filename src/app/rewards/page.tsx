import { redirect } from "next/navigation";

import { CustomerNav } from "@/components/CustomerNav";
import { DeviceReporter } from "@/components/DeviceReporter";
import { DigitalLoyaltyCard } from "@/components/DigitalLoyaltyCard";
import { customerStatePath, resolveCustomerAuthState } from "@/lib/auth/customer-state";
import { requireCustomerUser } from "@/lib/auth/customer-session";
import { isGoogleWalletConfigured } from "@/lib/wallet/google-wallet";

type DigitalCard = { publicToken: string; walletStatus: string; summary: { customer: { name: string }; attentions: { total: number; lastThree: Array<{ accountingDate: string; services: string[]; branch?: string; barber?: string }> }; rewards: { available: number; nextRewardName?: string; remaining?: number } } };

export default async function RewardsPage() {
  const { supabase, user } = await requireCustomerUser();
  if (!user) redirect("/login");
  const state = await resolveCustomerAuthState(supabase);
  if (state !== "ACTIVE") redirect(state === "BLOCKED" ? "/login?error=account_blocked" : customerStatePath(state));
  const { data, error } = await supabase.rpc("get_customer_digital_card");
  if (error) redirect("/registro");
  const card = data as DigitalCard;
  return <main className="customer-shell"><DeviceReporter /><DigitalLoyaltyCard initial={card} walletConfigured={isGoogleWalletConfigured()} /><section className="customer-card"><p className="customer-eyebrow">Historial breve</p><h2>Últimas atenciones</h2><ul className="customer-list">{card.summary.attentions.lastThree.map((visit, index) => <li key={`${visit.accountingDate}-${index}`}><strong>{visit.services.join(", ") || "Atención de servicio"}</strong><small>{visit.accountingDate} · {visit.branch ?? "Sede LBBS"}{visit.barber ? ` · ${visit.barber}` : ""}</small></li>)}{card.summary.attentions.lastThree.length === 0 ? <li>Aún no registramos atenciones con servicios.</li> : null}</ul></section><CustomerNav /></main>;
}
