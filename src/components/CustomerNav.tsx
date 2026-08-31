"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { showConfirm, showToast } from "@/lib/ui/alerts";
export function CustomerNav() { const router = useRouter(); async function logout() { if (!await showConfirm("Cerrar sesión", "Podrás volver a ingresar con Google cuando quieras.", "Cerrar sesión")) return; await createClient().auth.signOut(); await showToast("Sesión cerrada", "info"); router.replace("/login"); router.refresh(); } return <nav className="customer-nav"><Link href="/rewards">Inicio</Link><Link href="/movimientos">Movimientos</Link><Link href="/perfil">Perfil</Link><button type="button" onClick={() => void logout()}>Cerrar sesión</button></nav>; }
