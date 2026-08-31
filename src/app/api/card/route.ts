import { NextResponse } from "next/server";

import { requireCustomerUser } from "@/lib/auth/customer-session";

export async function GET() {
  const { supabase, user } = await requireCustomerUser();
  if (!user) return NextResponse.json({ error: "Sesión no iniciada." }, { status: 401 });
  const { data, error } = await supabase.rpc("get_customer_digital_card");
  return error ? NextResponse.json({ error: "No se pudo cargar la tarjeta digital." }, { status: 400 }) : NextResponse.json({ data });
}
