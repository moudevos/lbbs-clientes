import { NextResponse } from "next/server";

import { requireCustomerUser } from "@/lib/auth/customer-session";

export async function POST() {
  const { supabase, user } = await requireCustomerUser();
  if (!user) return NextResponse.json({ error: "Sesión no iniciada." }, { status: 401 });
  const { data, error } = await supabase.rpc("rotate_customer_public_token");
  return error ? NextResponse.json({ error: "No se pudo regenerar el QR." }, { status: 400 }) : NextResponse.json({ data });
}
