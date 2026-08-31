import { LoginButton } from "./LoginButton";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  return <main className="customer-auth-shell"><section className="customer-card"><p className="customer-eyebrow">La Bajadita</p><h1 className="customer-title">Rewards</h1><p className="customer-copy">Tu historial de atenciones y beneficios, siempre contigo.</p>{error ? <p className="customer-alert customer-error">{error === "account_blocked" ? "Tu cuenta está bloqueada. Comunícate con LBBS." : "No pudimos completar el ingreso con Google. Inténtalo nuevamente."}</p> : null}<div className="customer-form"><LoginButton /><p className="customer-copy">¿Ya tienes una cuenta?</p><LoginButton label="Iniciar sesión" /><p className="customer-copy">¿Primera vez?</p><LoginButton label="Crear mi cuenta" /></div></section></main>;
}
