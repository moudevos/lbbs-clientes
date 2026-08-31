import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCustomerUser } from "@/lib/auth/customer-session";

const schema = z.object({ installationId: z.string().uuid(), isPwa: z.boolean(), platform: z.string().trim().max(80), language: z.string().trim().max(20), timezone: z.string().trim().max(80) });
export async function POST(request: Request) { const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Dispositivo no válido." }, { status: 400 }); const { supabase, user } = await requireCustomerUser(); if (!user) return NextResponse.json({ error: "Sesión no iniciada." }, { status: 401 }); const { error } = await supabase.rpc("register_customer_device", { p_installation_id: parsed.data.installationId, p_platform: parsed.data.platform, p_language: parsed.data.language, p_timezone: parsed.data.timezone, p_is_pwa: parsed.data.isPwa }); if (error) return NextResponse.json({ error: error.message }, { status: 400 }); return NextResponse.json({ ok: true }); }
