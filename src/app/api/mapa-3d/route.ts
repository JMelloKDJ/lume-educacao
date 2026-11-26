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

type LumeClient = ReturnType<typeof getLumeSupabase>;

async function tryFetchFirst(
  supabase: LumeClient,
  candidates: string[]
): Promise<{ table: string | null; rows: Record<string, unknown>[]; error: string | null }> {
  let lastError: string | null = null;
  for (const name of candidates) {
    const { data, error } = await supabase.from(name).select("*").limit(2000);
    if (!error && Array.isArray(data)) {
      return {
        table: name,
        rows: data as Record<string, unknown>[],
        error: null,
      };
    }
    if (error) lastError = `${name}: ${error.message}`;
  }
  return { table: null, rows: [], error: lastError };
}

export async function GET() {
  try {
    const supabase = getLumeSupabase();

    const [
      elementosRes,
      atividadesRes,
      avancosRes,
      backlogRes,
      transicoesRes,
      epicosRes,
      releasesRes,
      riscosRes,
      evmRes,
    ] = await Promise.all([
      tryFetchFirst(supabase, [
        "elementos_3d",
        "t38_elementos_3d",
        "38_elementos_3d",
        "modelo_3d",
      ]),
      tryFetchFirst(supabase, [
        "atividades",
        "cronograma_atividades",
        "atividades_cronograma",
        "cronograma",
        "07_atividades",
      ]),
      tryFetchFirst(supabase, [
        "atividades_avanco",
        "avanco_fisico",
        "avanco_semanal",
        "avanco_fisico_semanal",
        "avanco_atividades",
        "boletim_avanco",
        "17_avanco_fisico",
        "17_atividades_avanco",
      ]),
      tryFetchFirst(supabase, ["backlog_itens", "itens_backlog", "14_backlog_itens"]),
      tryFetchFirst(supabase, ["itens_transicoes", "backlog_transicoes", "24_itens_transicoes"]),
      tryFetchFirst(supabase, ["epicos", "backlog_epicos", "13_epicos"]),
      tryFetchFirst(supabase, ["releases", "backlog_releases", "16_releases"]),
      tryFetchFirst(supabase, ["riscos_ocorrencias", "ocorrencias_riscos", "28_riscos_ocorrencias"]),
      tryFetchFirst(supabase, ["vw_evm_resumo"]),
    ]);

    if (!elementosRes.table) {
      return NextResponse.json(
        {
          error:
            "Não foi possível localizar a tabela elementos_3d no schema lume_educacao.",
          detail: elementosRes.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      elementos: elementosRes.rows,
      atividades: atividadesRes.rows,
      avancos: avancosRes.rows,
      backlog: backlogRes.rows,
      transicoes: transicoesRes.rows,
      epicos: epicosRes.rows,
      releases: releasesRes.rows,
      riscos: riscosRes.rows,
      evm: evmRes.rows,
      sources: {
        elementos: elementosRes.table,
        atividades: atividadesRes.table,
        avancos: avancosRes.table,
        backlog: backlogRes.table,
        transicoes: transicoesRes.table,
        epicos: epicosRes.table,
        releases: releasesRes.table,
        riscos: riscosRes.table,
        evm: evmRes.table,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Erro interno ao consultar dados 3D.",
      },
      { status: 500 }
    );
  }
}
