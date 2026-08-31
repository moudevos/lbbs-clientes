import { NextResponse } from "next/server";

import { createServiceClient } from "@/lib/supabase/service";
import { hasValidInternalSecret, isGoogleWalletConfigured, syncGoogleWalletPass } from "@/lib/wallet/google-wallet";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasValidInternalSecret(request.headers.get("x-wallet-sync-secret"))) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  if (!isGoogleWalletConfigured()) return NextResponse.json({ data: { processed: 0, skipped: "not_configured" } });
  const supabase = createServiceClient();
  const { data: jobs } = await supabase.from("customer_wallet_sync_outbox").select("id,customer_id,attempts").eq("status", "pending").lte("available_at", new Date().toISOString()).order("created_at", { ascending: true }).limit(20);
  let processed = 0;
  for (const job of jobs ?? []) {
    const { data: claimed } = await supabase.from("customer_wallet_sync_outbox").update({ status: "processing", locked_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", job.id).eq("status", "pending").select("id").maybeSingle();
    if (!claimed) continue;
    try {
      await syncGoogleWalletPass(job.customer_id);
      await supabase.from("customer_wallet_sync_outbox").update({ status: "completed", processed_at: new Date().toISOString(), last_error: null, updated_at: new Date().toISOString() }).eq("id", job.id);
      processed += 1;
      console.info("[wallet] sync completed");
    } catch (reason) {
      const attempts = job.attempts + 1;
      const delayMinutes = Math.min(60, 2 ** Math.min(attempts, 6));
      await supabase.from("customer_wallet_sync_outbox").update({ status: attempts >= 8 ? "failed" : "pending", attempts, available_at: new Date(Date.now() + delayMinutes * 60_000).toISOString(), last_error: reason instanceof Error ? reason.message.slice(0, 500) : "unknown", updated_at: new Date().toISOString() }).eq("id", job.id);
      console.error("[wallet] sync failed", { attempts });
    }
  }
  return NextResponse.json({ data: { processed } });
}
