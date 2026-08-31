"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { showError, showToast } from "@/lib/ui/alerts";

type LinkStatus = {
  status?: "pending" | "approved" | "code_generated" | "linked" | "rejected" | "expired";
  expiresAt?: string | null;
  attemptsRemaining?: number | null;
};

const isWaiting = (status?: LinkStatus["status"]) => status === "pending" || status === "approved";

export function LinkingClient() {
  const router = useRouter();
  const [status, setStatus] = useState<LinkStatus | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function refreshStatus() {
    const response = await fetch("/api/identity/link-status", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "No se pudo verificar la vinculación.");
    const next = result.data as LinkStatus;
    setStatus(next);
    return next;
  }

  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setInterval> | undefined;
    const supabase = createClient();

    const sync = async () => {
      try {
        const next = await refreshStatus();
        if (!isWaiting(next.status) && timer) {
          clearInterval(timer);
          timer = undefined;
        }
        return next;
      } catch {
        return undefined;
      }
    };

    const setup = async () => {
      const initial = await sync();
      if (!mounted) return undefined;
      const { data } = await supabase.auth.getUser();
      if (!mounted || !data.user) return undefined;

      const channel = supabase
        .channel(`customer-link-${data.user.id}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "customer_link_requests", filter: `auth_user_id=eq.${data.user.id}` },
          () => void sync(),
        )
        .subscribe();

      if (isWaiting(initial?.status)) timer = setInterval(() => void sync(), 8_000);
      return () => void supabase.removeChannel(channel);
    };

    let removeChannel: (() => void) | undefined;
    void setup().then((cleanup) => {
      if (mounted) removeChannel = cleanup;
      else cleanup?.();
    });
    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
      removeChannel?.();
    };
  }, []);

  async function confirm() {
    setBusy(true);
    try {
      const response = await fetch("/api/identity/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Código inválido o expirado.");
      await showToast("Cuenta vinculada correctamente");
      router.replace("/rewards");
      router.refresh();
    } catch (error) {
      await showError("No se pudo vincular", error instanceof Error ? error.message : "Código inválido o expirado.");
    } finally {
      setBusy(false);
    }
  }

  const waiting = !status || isWaiting(status.status);
  return (
    <section className="customer-card">
      <p className="customer-eyebrow">Vinculación</p>
      <h1 className="customer-title">{waiting ? "Estamos validando tu cuenta" : "Tu cuenta fue validada"}</h1>
      {waiting ? <p className="customer-copy">El personal de LBBS revisará tu ficha. Esta pantalla se actualizará automáticamente al generar tu código.</p> : (
        <div className="customer-form">
          <p className="customer-copy">Ingresa el código de 6 dígitos que te proporcionó el personal.</p>
          <label className="customer-label">Código de vinculación
            <input className="customer-input" value={code} maxLength={6} inputMode="numeric" autoComplete="one-time-code" onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} />
          </label>
          <button className="customer-button" type="button" disabled={busy || code.length !== 6} onClick={() => void confirm()}>{busy ? "Verificando..." : "Confirmar"}</button>
        </div>
      )}
      {status?.attemptsRemaining != null ? <p className="customer-alert">Intentos disponibles: {status.attemptsRemaining}</p> : null}
    </section>
  );
}
