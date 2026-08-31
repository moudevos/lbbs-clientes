import { redirect } from "next/navigation";
import { RegistrationForm } from "./RegistrationForm";
import { requireCustomerUser } from "@/lib/auth/customer-session";
import { customerStatePath, resolveCustomerAuthState } from "@/lib/auth/customer-state";

export default async function RegistroPage() {
  const { supabase, user } = await requireCustomerUser();
  if (!user) redirect("/login");
  const state = await resolveCustomerAuthState(supabase);
  if (state !== "AUTHENTICATED_UNREGISTERED") redirect(state === "BLOCKED" ? "/login?error=account_blocked" : customerStatePath(state));
  const metadata = user.user_metadata ?? {};
  const fallbackName = String(metadata.full_name ?? metadata.name ?? "").trim();
  const fallbackParts = fallbackName ? fallbackName.split(/\s+/) : [];
  const defaultFirstName = String(metadata.given_name ?? metadata.first_name ?? fallbackParts.shift() ?? "");
  const defaultLastName = String(metadata.family_name ?? metadata.last_name ?? fallbackParts.join(" ") ?? "");
  return <main className="customer-shell"><section className="customer-card"><p className="customer-eyebrow">Paso 1 de 2</p><h1 className="customer-title">Completa tu información</h1><p className="customer-copy">Usamos tu documento para encontrar tu ficha existente o crear una nueva.</p><RegistrationForm defaultFirstName={defaultFirstName} defaultLastName={defaultLastName} defaultEmail={user.email ?? ""} /></section></main>;
}
