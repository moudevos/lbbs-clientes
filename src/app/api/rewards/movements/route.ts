import { NextResponse } from "next/server";

import { requireCustomerUser } from "@/lib/auth/customer-session";

function integerParam(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number(value ?? fallback);
  return Number.isInteger(parsed) ? Math.min(Math.max(parsed, min), max) : fallback;
}

export async function GET(request: Request) {
  const { supabase, user } = await requireCustomerUser();
  if (!user) return NextResponse.json({ error: "Sesión no iniciada." }, { status: 401 });
  const url = new URL(request.url);
  const limit = integerParam(url.searchParams.get("limit"), 20, 1, 50);
  const offset = integerParam(url.searchParams.get("offset"), 0, 0, Number.MAX_SAFE_INTEGER);
  const { data, error } = await supabase.rpc("get_customer_reward_movements", { p_limit: limit, p_offset: offset });
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ data });
}
