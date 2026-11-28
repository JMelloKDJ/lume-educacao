import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query, queryReadOnly } from "@/lib/db";

export const dynamic = "force-dynamic";

const workspaceMutationSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("update_risk_status"),
    id_risco: z.string().trim().min(1).max(32),
    status: z.enum(["ABERTO", "ENCERRADO", "OCORRIDO"]),
  }),
  z.object({
    action: z.literal("add_risk"),
    descricao: z.string().trim().min(3).max(500),
    frente: z.string().trim().min(2).max(40),
    categoria: z.string().trim().min(2).max(40).optional(),
    probabilidade_pct: z.number().min(1).max(100),
    impacto_custo_rs: z.number().min(0).optional(),
    impacto_prazo_du: z.number().int().min(0).optional(),
    estrategia_resposta: z.string().trim().max(40).optional(),
    id_responsavel: z.string().trim().max(24).optional(),
  }),
  z.object({
    action: z.literal("update_kr"),
    id_resultado_chave: z.string().trim().min(1).max(24),
    valor: z.number(),
  }),
  z.object({
    action: z.literal("approve_scenario"),
    id_cenario: z.string().trim().min(1).max(32),
    nome_cenario: z.string().trim().min(1).max(120),
  }),
]);

export async function GET() {
  try {
    const [
      paramRows,
      evm,
      controles,
      sprints,
      riscosResumoRows,
      riscos,
      mudancas,
      okrs,
      cenarios,
      pert,
      atividades,
      custosMensais,
      elementos3d,
      avancos,
    ] = await Promise.all([
      queryReadOnly<{ valor: string }>(
        `SELECT valor FROM lume_educacao.projeto_parametros WHERE parametro = 'data_status' LIMIT 1`
      ),
      queryReadOnly(`SELECT * FROM lume_educacao.vw_evm_resumo`),
      queryReadOnly(`SELECT * FROM lume_educacao.vw_numeros_controle ORDER BY ordem`),
      queryReadOnly(`SELECT * FROM lume_educacao.vw_velocidade_sprints ORDER BY numero`),
      queryReadOnly(`SELECT * FROM lume_educacao.vw_riscos_reservas_alcadas LIMIT 1`),
      queryReadOnly(`SELECT * FROM lume_educacao.riscos_registro ORDER BY id_risco`),
      queryReadOnly(
        `SELECT * FROM lume_educacao.mudancas_solicitacoes ORDER BY id_mudanca DESC LIMIT 20`
      ),
      queryReadOnly(
        `SELECT * FROM lume_educacao.vw_piloto_okrs_resumo ORDER BY id_resultado_chave`
      ),
      queryReadOnly(`SELECT * FROM lume_educacao.vw_cenarios_base ORDER BY id_cenario`),
      queryReadOnly(`SELECT * FROM lume_educacao.vw_rede_pert_cpm`),
      queryReadOnly(`SELECT * FROM lume_educacao.atividades`),
      queryReadOnly<{ mes: string; total_rs: number }>(
        `SELECT to_char(date_trunc('month', data), 'YYYY-MM') AS mes,
                ROUND(SUM(valor_rs)::numeric, 2)::float8 AS total_rs
         FROM lume_educacao.custos_realizados
         GROUP BY 1
         ORDER BY 1`
      ),
      queryReadOnly(
        `SELECT * FROM lume_educacao.elementos_3d ORDER BY ordem_de_implantacao, id_elemento`
      ),
      queryReadOnly(
        `SELECT DISTINCT ON (id_atividade)
                id_atividade,
                avanco_acumulado_pct,
                situacao,
                semana_fim::text AS semana_fim
         FROM lume_educacao.avanco_semanal
         ORDER BY id_atividade, semana_fim DESC`
      ),
    ]);

    let cenarioAprovado: { id_cenario: string; nome_cenario: string; created_at: string } | null =
      null;
    try {
      const decRows = await queryReadOnly<{
        payload: { id_cenario?: string; nome_cenario?: string };
        created_at: string;
      }>(
        `SELECT payload, created_at::text
         FROM lume_agent.agent_actions
         WHERE action_type = 'DECISAO_CENARIO'
         ORDER BY created_at DESC
         LIMIT 1`
      );
      const top = decRows[0];
      if (top?.payload?.id_cenario) {
        cenarioAprovado = {
          id_cenario: top.payload.id_cenario,
          nome_cenario: top.payload.nome_cenario ?? top.payload.id_cenario,
          created_at: top.created_at,
        };
      }
    } catch {
      // Tabela lume_agent.agent_actions pode ainda estar vazia ou indisponível
    }

    return NextResponse.json({
      source: "supabase",
      dataStatus: paramRows[0]?.valor ?? "2026-11-13",
      evm,
      controles,
      sprints,
      riscosResumo: riscosResumoRows[0] ?? null,
      riscos,
      mudancas,
      okrs,
      cenarios,
      pert,
      atividades,
      custosMensais,
      elementos3d,
      avancos,
      cenarioAprovado,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Erro ao consultar dados do workspace.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = workspaceMutationSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload inválido", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const input = parsed.data;

    if (input.action === "update_risk_status") {
      const rows = await query(
        `UPDATE lume_educacao.riscos_registro
         SET status = $2
         WHERE id_risco = $1
         RETURNING *`,
        [input.id_risco.toUpperCase(), input.status]
      );
      if (rows.length === 0) {
        return NextResponse.json(
          { error: `Risco ${input.id_risco} não encontrado.` },
          { status: 404 }
        );
      }
      return NextResponse.json({ ok: true, risk: rows[0] });
    }

    if (input.action === "add_risk") {
      const [maxRow] = await queryReadOnly<{ max_num: number | null }>(
        `SELECT MAX(NULLIF(regexp_replace(id_risco, '\\D', '', 'g'), '')::integer) AS max_num
         FROM lume_educacao.riscos_registro`
      );
      const nextNum = (maxRow?.max_num ?? 15) + 1;
      const nextId = `R${String(nextNum).padStart(2, "0")}`;

      let validResponsavel: string | null = null;
      if (input.id_responsavel) {
        const eq = await queryReadOnly<{ id_pessoa: string }>(
          `SELECT id_pessoa FROM lume_educacao.equipe WHERE UPPER(id_pessoa) = UPPER($1) LIMIT 1`,
          [input.id_responsavel]
        );
        validResponsavel = eq[0]?.id_pessoa ?? null;
      }

      const rows = await query(
        `INSERT INTO lume_educacao.riscos_registro (
           id_risco, data_identificacao, tipo_risco, categoria, descricao,
           probabilidade_pct, impacto_custo_rs, impacto_prazo_du, frente,
           estrategia_resposta, id_responsavel, status
         ) VALUES (
           $1, CURRENT_DATE, 'AMEACA', $2, $3,
           $4, $5, $6, $7,
           $8, $9, 'ABERTO'
         )
         RETURNING *`,
        [
          nextId,
          (input.categoria ?? "TECNICO").toUpperCase(),
          input.descricao,
          Math.round(input.probabilidade_pct),
          input.impacto_custo_rs ?? 10000,
          input.impacto_prazo_du ?? 0,
          input.frente.toUpperCase(),
          (input.estrategia_resposta ?? "MITIGAR").toUpperCase(),
          validResponsavel,
        ]
      );

      return NextResponse.json({ ok: true, risk: rows[0] }, { status: 201 });
    }

    if (input.action === "update_kr") {
      const krId = input.id_resultado_chave.toUpperCase();
      const metaRows = await queryReadOnly<{
        id_objetivo: string;
        objetivo: string;
        id_resultado_chave: string;
        resultado_chave: string;
        unidade: string;
        valor_base: number;
        meta: number;
        sentido: string;
      }>(
        `SELECT id_objetivo, objetivo, id_resultado_chave, resultado_chave,
                unidade, valor_base, meta, sentido
         FROM lume_educacao.okr_medicoes
         WHERE id_resultado_chave = $1
         ORDER BY data_medicao DESC
         LIMIT 1`,
        [krId]
      );

      const ref = metaRows[0];
      if (!ref) {
        return NextResponse.json(
          { error: `KR ${krId} não encontrado em okr_medicoes.` },
          { status: 404 }
        );
      }

      const rows = await query(
        `INSERT INTO lume_educacao.okr_medicoes (
           id_objetivo, objetivo, id_resultado_chave, resultado_chave,
           unidade, valor_base, meta, sentido, data_medicao, valor
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE, $9)
         ON CONFLICT (id_resultado_chave, data_medicao)
         DO UPDATE SET valor = EXCLUDED.valor
         RETURNING *`,
        [
          ref.id_objetivo,
          ref.objetivo,
          ref.id_resultado_chave,
          ref.resultado_chave,
          ref.unidade,
          ref.valor_base,
          ref.meta,
          ref.sentido,
          input.valor,
        ]
      );

      return NextResponse.json({ ok: true, kr: rows[0] });
    }

    if (input.action === "approve_scenario") {
      const rows = await query<{ id: string; created_at: string }>(
        `INSERT INTO lume_agent.agent_actions (
           conversation_id, action_type, payload, governance_level, status
         ) VALUES (NULL, 'DECISAO_CENARIO', $1::jsonb, 'COMITE', 'aprovada')
         RETURNING id, created_at::text`,
        [
          JSON.stringify({
            id_cenario: input.id_cenario,
            nome_cenario: input.nome_cenario,
          }),
        ]
      );
      return NextResponse.json({
        ok: true,
        decisionId: rows[0]?.id ?? null,
        cenarioAprovado: {
          id_cenario: input.id_cenario,
          nome_cenario: input.nome_cenario,
          created_at: rows[0]?.created_at ?? new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({ error: "Ação não suportada." }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Erro ao gravar alteração no Supabase.",
      },
      { status: 500 }
    );
  }
}
