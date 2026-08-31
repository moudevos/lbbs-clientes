"use client";

import { useState } from "react";
import { getCustomerAppUrl } from "@/lib/auth/customer-url";
import { createClient } from "@/lib/supabase/client";

export function LoginButton({ label = "Continuar con Google" }: { label?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  async function continueWithGoogle() {
    setLoading(true); setError(null);
    const { error: oauthError } = await createClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${getCustomerAppUrl()}/auth/callback` } });
    if (oauthError) { setError("No se pudo iniciar Google. Intenta nuevamente."); setLoading(false); }
  }
  return <>{<button className="customer-button" type="button" disabled={loading} onClick={continueWithGoogle}>{loading ? "Abriendo Google..." : label}</button>}{error ? <p className="customer-alert customer-error">{error}</p> : null}</>;
}
