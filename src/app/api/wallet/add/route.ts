import { NextResponse } from "next/server";

import { requireCustomerUser } from "@/lib/auth/customer-session";
import { createGoogleWalletSaveUrl, isGoogleWalletConfigured, syncGoogleWalletPass, type WalletProjection } from "@/lib/wallet/google-wallet";

export const runtime = "nodejs";

export async function POST() {
  const { supabase, user } = await requireCustomerUser();
  if (!user) return NextResponse.json({ error: "Sesión no iniciada." }, { status: 401 });
  if (!isGoogleWalletConfigured()) return NextResponse.json({ error: "Google Wallet no está configurado." }, { status: 503 });
  const { data: account } = await supabase.from("customer_accounts").select("customer_id").eq("auth_user_id", user.id).eq("status", "active").maybeSingle();
  if (!account?.customer_id) return NextResponse.json({ error: "La cuenta de cliente no está vinculada." }, { status: 403 });
  const { data: card, error } = await supabase.rpc("get_customer_digital_card");
  if (error) return NextResponse.json({ error: "No se pudo preparar la tarjeta digital." }, { status: 400 });
  const digital = card as { publicToken: string; summary: { customer: { name: string }; attentions: { total: number; lastThree: Array<{ accountingDate: string; services: string[] }> }; rewards: { available: number; nextRewardName?: string; remaining?: number } } };
  try {
    const projection: WalletProjection = {
      customerName: digital.summary.customer.name,
      publicToken: digital.publicToken,
      memberId: `LBBS-${digital.publicToken.slice(-8)}`,
      attentions: digital.summary.attentions.total,
      availableRewards: digital.summary.rewards.available,
      nextRewardName: digital.summary.rewards.nextRewardName,
      remaining: digital.summary.rewards.remaining,
      lastVisits: digital.summary.attentions.lastThree.map((visit) => ({ date: visit.accountingDate, services: visit.services.join(", ") || "Atención de servicio" })),
    };
    const synced = await syncGoogleWalletPass(account.customer_id, projection);
    if (!synced.configured) return NextResponse.json({ error: "Google Wallet no está configurado." }, { status: 503 });
    const saveUrl = await createGoogleWalletSaveUrl(synced.objectId);
    return NextResponse.json({ data: { saveUrl, status: "prepared" } }, { headers: { "Cache-Control": "no-store" } });
  } catch (reason) {
    console.error("[wallet] initial sync failed", { message: reason instanceof Error ? reason.message : "unknown" });
    return NextResponse.json({ error: "No se pudo preparar Google Wallet. Inténtalo nuevamente." }, { status: 502 });
  }
}
