"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { showError, showSuccess, showToast } from "@/lib/ui/alerts";

type Props = { defaultFirstName: string; defaultLastName: string; defaultEmail: string };
export function RegistrationForm({ defaultFirstName, defaultLastName, defaultEmail }: Props) {
  const router = useRouter(); const submitted = useRef(false); const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (submitted.current) return; submitted.current = true; setBusy(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/identity/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firstName: form.get("firstName"), lastName: form.get("lastName"), documentType: form.get("documentType"), documentNumber: form.get("documentNumber"), phone: form.get("phone"), email: form.get("email") }) });
    const result = await response.json();
    if (!response.ok) { submitted.current = false; setBusy(false); await showError("Revisa tus datos", result.error || "No se pudo guardar tu información."); return; }
    if (result.data?.status === "pending") { await showToast("Solicitud de vinculación enviada", "info"); router.replace("/vincular"); } else { await showSuccess("Cuenta creada", "Tu identidad digital ya está lista."); router.replace("/rewards"); }
    router.refresh();
  }
  return <form className="customer-form" onSubmit={submit}><label className="customer-label">Nombres<input className="customer-input" name="firstName" autoComplete="given-name" defaultValue={defaultFirstName} required /></label><label className="customer-label">Apellidos<input className="customer-input" name="lastName" autoComplete="family-name" defaultValue={defaultLastName} required /></label><label className="customer-label">Correo<input className="customer-input" name="email" defaultValue={defaultEmail} type="email" autoComplete="email" readOnly={Boolean(defaultEmail)} /></label><label className="customer-label">Tipo de documento<select className="customer-input" name="documentType" defaultValue="DNI"><option>DNI</option><option>CE</option><option>Pasaporte</option><option>RUC</option><option>Otro</option></select></label><label className="customer-label">Número de documento<input className="customer-input" name="documentNumber" inputMode="numeric" autoComplete="off" required /></label><label className="customer-label">Teléfono<input className="customer-input" name="phone" inputMode="tel" autoComplete="tel" required /></label><button className="customer-button" disabled={busy}>{busy ? "Guardando..." : "Continuar"}</button></form>;
}
