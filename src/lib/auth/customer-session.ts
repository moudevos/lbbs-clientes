import { createClient } from "@/lib/supabase/server";
export async function requireCustomerUser() { const supabase = await createClient(); const { data, error } = await supabase.auth.getUser(); return { supabase, user: error ? null : data.user }; }
