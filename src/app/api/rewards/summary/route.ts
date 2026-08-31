import { NextResponse } from "next/server";
import { requireCustomerUser } from "@/lib/auth/customer-session";
export async function GET() { const { supabase, user } = await requireCustomerUser(); if (!user) return NextResponse.json({ error: "Sesión no iniciada." }, { status: 401 }); const { data, error } = await supabase.rpc("get_customer_loyalty_summary"); if (error) return NextResponse.json({ error: error.message }, { status: 400 }); return NextResponse.json({ data }); }
