"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

import { showConfirm, showError, showToast } from "@/lib/ui/alerts";

type Visit = { accountingDate: string; services: string[]; branch?: string; barber?: string };
type CardData = { publicToken: string; walletStatus: string; summary: { customer: { name: string }; attentions: { total: number; lastThree: Visit[] }; rewards: { available: number; nextRewardName?: string; remaining?: number } } };

export function DigitalLoyaltyCard({ initial, walletConfigured }: { initial: CardData; walletConfigured: boolean }) {
  const [data, setData] = useState(initial);
  const [qr, setQr] = useState("");
  const [busy, setBusy] = useState<"rotate" | "wallet" | null>(null);

  useEffect(() => { void QRCode.toDataURL(data.publicToken, { width: 220, margin: 1, errorCorrectionLevel: "M", color: { dark: "#10213a", light: "#ffffff" } }).then(setQr); }, [data.publicToken]);

  async function rotate() {
    if (!await showConfirm("Regenerar código QR", "El código QR anterior dejará de funcionar.", "Regenerar")) return;
    setBusy("rotate");
    try {
      const response = await fetch("/api/card/rotate", { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo regenerar el QR.");
      setData((previous) => ({ ...previous, publicToken: result.data.token }));
      await showToast("Código QR regenerado");
    } catch (error) { await showError("No se pudo regenerar", error instanceof Error ? error.message : "Inténtalo nuevamente."); }
    finally { setBusy(null); }
  }

  async function addWallet() {
    setBusy("wallet");
    try {
      const response = await fetch("/api/wallet/add", { method: "POST", headers: { "Cache-Control": "no-store" } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo preparar Google Wallet.");
      window.location.assign(result.data.saveUrl);
    } catch (error) { await showError("Google Wallet", error instanceof Error ? error.message : "Inténtalo nuevamente."); }
    finally { setBusy(null); }
  }

  const { summary } = data;
  return <section className="digital-card"><div className="digital-card__brand"><span>LA BAJADITA</span><small>REWARDS</small></div><p className="digital-card__name">{summary.customer.name}</p><div className="digital-card__metrics"><div><small>Atenciones</small><strong>{summary.attentions.total}</strong></div><div><small>Rewards</small><strong>{summary.rewards.available}</strong></div></div><p className="digital-card__progress">{summary.rewards.nextRewardName ? `${summary.rewards.remaining ?? 0} visita(s) para ${summary.rewards.nextRewardName}` : "Consulta tus próximos beneficios"}</p>{qr ? <img className="digital-card__qr" src={qr} width={160} height={160} alt="Código QR de tarjeta LBBS" /> : <div className="digital-card__qr digital-card__qr--loading" aria-label="Cargando código QR" />}<small className="digital-card__token">Tarjeta digital LBBS</small><div className="digital-card__actions"><button className="customer-button customer-button--secondary" type="button" onClick={() => void rotate()} disabled={busy !== null}>{busy === "rotate" ? "Regenerando..." : "Regenerar QR"}</button><button className="customer-button" type="button" onClick={() => void addWallet()} disabled={busy !== null || !walletConfigured}>{busy === "wallet" ? "Preparando..." : data.walletStatus === "active" ? "Abrir Google Wallet" : "Agregar a Google Wallet"}</button></div>{!walletConfigured ? <p className="customer-alert">Google Wallet no configurado en este entorno.</p> : null}</section>;
}
