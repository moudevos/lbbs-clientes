import { NextResponse } from "next/server";
import { requireCustomerUser } from "@/lib/auth/customer-session";
import { customerRegistrationSchema } from "@/lib/validation/customer";

export async function POST(request: Request) {
  const parsed = customerRegistrationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Completa tus datos." }, { status: 400 });
  const { supabase, user } = await requireCustomerUser();
  if (!user) return NextResponse.json({ error: "Sesión no iniciada." }, { status: 401 });
  const { data, error } = await supabase.rpc("register_customer_identity_v2", { p_document_type: parsed.data.documentType, p_document_number: parsed.data.documentNumber, p_phone: parsed.data.phone, p_first_name: parsed.data.firstName, p_last_name: parsed.data.lastName, p_email: parsed.data.email ?? user.email ?? null });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}
