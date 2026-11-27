import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getLumeSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Variáveis do Supabase não configuradas no ambiente.");
  }

  return createClient(url, key, {
    auth: { persistSession: false },
    db: { schema: "lume_educacao" as unknown as "public" },
  });
}

export async function GET() {
  try {
    const supabase = getLumeSupabase();

    const [evmRes, pertRes, atividadesRes, orcamentoRes, cenariosRes] = await Promise.all([
      supabase.from("vw_evm_resumo").select("*"),
      supabase.from("vw_rede_pert_cpm").select("*"),
      supabase.from("atividades").select("*"),
      supabase.from("orcamento_linha_de_base").select("*"),
      supabase.from("vw_cenarios_base").select("*"),
    ]);

    return NextResponse.json({
      evm: evmRes.data ?? [],
      pert: pertRes.data ?? [],
      atividades: atividadesRes.data ?? [],
      orcamento: orcamentoRes.data ?? [],
      cenarios: cenariosRes.data ?? [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno ao buscar dados preditivos." },
      { status: 500 }
    );
  }
}
