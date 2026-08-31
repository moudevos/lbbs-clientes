import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCustomerUser } from "@/lib/auth/customer-session";
const schema = z.object({ code: z.string().regex(/^\d{6}$/) });
export async function POST(request: Request) { const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Ingresa el código de 6 dígitos." }, { status: 400 }); const { supabase, user } = await requireCustomerUser(); if (!user) return NextResponse.json({ error: "Sesión no iniciada." }, { status: 401 }); const { data, error } = await supabase.rpc("confirm_customer_link", { p_code: parsed.data.code }); if (error) return NextResponse.json({ error: error.message }, { status: 400 }); return NextResponse.json({ data }); }
