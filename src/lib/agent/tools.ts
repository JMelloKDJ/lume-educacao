import type { FunctionDeclaration } from "@google/genai";
import { z } from "zod";
import { query, queryReadOnly } from "../db";
import { getToolCache, setToolCache } from "./cache";
import { searchKnowledgeBase } from "./rag";

export const TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "consultar_metricas_fluxo_agil",
    description:
      "Consulta indicadores ao vivo de M5 / Fluxo Ágil e DORA (velocidade, MM5, burndown, previsão de releases R1-R3, CFR, Lead Time de mudanças, MTTR, revisão por par, defeitos, impedimentos e os 13 números de controle).",
    parametersJsonSchema: {
      type: "object",
      properties: {
        corte: {
          type: "string",
          enum: ["ATUAL", "2026-11-13", "2026-10-30"],
          description: "Data de corte desejada. Padrão: ATUAL.",
        },
        incluir_serie_sprints: {
          type: "boolean",
          description: "Se true, inclui série histórica S01..Sn e previsão de releases.",
        },
      },
    },
  },
  {
    name: "consultar_evm_custos",
    description:
      "Consulta o Earned Value Management (EVM) calculado dinamicamente no Postgres (ONT, VP, VA, CR, IDP, IDC, ENT típica/atípica/composta, VNT, IDPT, custo real por ponto ágil e gestão) mais resumo de custos realizados por categoria.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        frente: {
          type: "string",
          enum: ["TODAS", "PREDITIVA", "AGIL", "PROJETO", "GESTAO"],
          description: "Filtro por frente. Padrão: TODAS.",
        },
      },
    },
  },
  {
    name: "consultar_riscos_reservas_alcadas",
    description:
      "Consulta reservas de contingência e gerencial (consumo e saldo), VME de ameaças/oportunidades abertas, lista de riscos abertos, solicitações de mudança (SMs), pedidos diretos e matriz de alçadas.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        incluir_lista_sms: {
          type: "boolean",
          description: "Se true, retorna todas as SMs cadastradas com seu status e alçada.",
        },
      },
    },
  },
  {
    name: "consultar_piloto_okrs_cenarios",
    description:
      "Consulta os OKRs (KR1-KR6), funil semanal do piloto (ativos, ativação, retenção 4 semanas, NPS, receita, chamados) e parâmetros dos cenários C1-C6 e caso de negócio base.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        id_cenario: {
          type: "string",
          description: "Opcional: C1, C2, C3, C4, C5 ou C6 para detalhar um cenário específico.",
        },
      },
    },
  },
  {
    name: "consultar_equipe_e_backlog",
    description:
      "Consulta carga de horas, extras, folha e produtividade por pessoa da equipe (P01-P18) e faz drill-down em itens do backlog (por id_item LU-xxx, sprint S01-S14 ou origem PEDIDO_DIRETO/DEFEITO/MUDANCA_APROVADA).",
    parametersJsonSchema: {
      type: "object",
      properties: {
        id_item: { type: "string", description: "Ex.: LU-239, LU-235" },
        id_sprint: { type: "string", description: "Ex.: S14, S13" },
        origem: {
          type: "string",
          enum: ["PLANO_INICIAL", "MUDANCA_APROVADA", "PEDIDO_DIRETO", "DEFEITO"],
        },
        incluir_equipe: {
          type: "boolean",
          description: "Se true, retorna tabela de horas e produtividade da equipe.",
        },
      },
    },
  },
  {
    name: "buscar_documentacao_lume",
    description:
      "Busca semântica (RAG pgvector com gemini-embedding-2) em toda a documentação oficial da Lume Educação: Dossiê, DICIONARIO.md (convenções 1-23), diagnósticos (LE-39, D1, D6, D9, D11, D12, D14, D15, D16, D17, M5, qualidade-dos-dados) e Deck Executivo.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        consulta: {
          type: "string",
          description: "Pergunta ou tópico semântico para buscar nos documentos.",
        },
        limite: {
          type: "integer",
          description: "Quantidade de trechos (1 a 10). Padrão: 5.",
        },
      },
      required: ["consulta"],
    },
  },
  {
    name: "registrar_acao_governanca",
    description:
      "Registra uma ação real auditável no schema operacional lume_agent.agent_actions (abertura de Solicitação de Mudança com enquadramento automático na 05_matriz_alcadas, agendamento de deliberação do Comitê ou registro de plano de mitigação/decisão).",
    parametersJsonSchema: {
      type: "object",
      properties: {
        tipo_acao: {
          type: "string",
          enum: ["SOLICITACAO_MUDANCA", "AGENDAR_DELIBERACAO", "PLANO_MITIGACAO"],
        },
        titulo: { type: "string", description: "Resumo curto da ação." },
        descricao: { type: "string", description: "Detalhamento completo." },
        impacto_custo_rs: { type: "number", description: "Impacto financeiro estimado em R$." },
        impacto_prazo_du: { type: "integer", description: "Impacto em dias úteis." },
        altera_escopo: { type: "boolean", description: "Se a ação altera escopo aprovado." },
        responsavel: { type: "string", description: "Pessoa ou stakeholder responsável (ex.: P01, PI01)." },
        data_prevista: { type: "string", description: "Data ou prazo previsto (AAAA-MM-DD ou sprint)." },
        referencia: { type: "string", description: "ID relacionado (ex.: C4, R15, LU-239)." },
      },
      required: ["tipo_acao", "titulo", "descricao"],
    },
  },
  {
    name: "delegate_complex_analysis",
    description:
      "Escalona autonomamente a solicitação para o modelo analítico mais capaz (gemini-3.8-flash) quando você avaliar que a tarefa exige cruzamento complexo multi-frente (ex.: comparar múltiplos cenários C1-C6, cruzar EVM + riscos + alçadas, ou interpretar impacto completo de um Boletim Surpresa).",
    parametersJsonSchema: {
      type: "object",
      properties: {
        pergunta_consolidada: {
          type: "string",
          description: "Síntese clara do problema que exige análise profunda.",
        },
        motivo_escalonamento: {
          type: "string",
          description: "Por que você decidiu acionar o modelo flash.",
        },
        evidencias_coletadas: {
          type: "string",
          description: "Resumo de fatos/números já consultados até o momento, se houver.",
        },
      },
      required: ["pergunta_consolidada", "motivo_escalonamento"],
    },
  },
];

export const ACTION_TOOLS_WITHOUT_DELEGATE: FunctionDeclaration[] =
  TOOL_DECLARATIONS.filter((t) => t.name !== "delegate_complex_analysis");

const actionSchema = z.object({
  tipo_acao: z.enum(["SOLICITACAO_MUDANCA", "AGENDAR_DELIBERACAO", "PLANO_MITIGACAO"]),
  titulo: z.string().min(3),
  descricao: z.string().min(5),
  impacto_custo_rs: z.number().optional(),
  impacto_prazo_du: z.number().int().optional(),
  altera_escopo: z.boolean().optional(),
  responsavel: z.string().optional(),
  data_prevista: z.string().optional(),
  referencia: z.string().optional(),
});

export interface ToolExecResult {
  output: Record<string, unknown>;
  cacheHit: boolean;
  ragChunks: number;
  actionCreated: boolean;
}

export async function executeToolCall(
  name: string,
  rawArgs: Record<string, unknown>,
  ctx: { conversationId: string; dataFingerprint: string }
): Promise<ToolExecResult> {
  if (name === "registrar_acao_governanca") {
    const parsed = actionSchema.parse(rawArgs);
    const alcadas = await queryReadOnly<{
      nivel_decisor: string;
      limite_custo_rs: number | null;
      limite_prazo_du: number | null;
      pode_alterar_escopo: string;
    }>(`SELECT nivel_decisor, limite_custo_rs, limite_prazo_du, pode_alterar_escopo FROM lume_educacao.matriz_alcadas`);

    const custo = parsed.impacto_custo_rs ?? 0;
    const prazo = parsed.impacto_prazo_du ?? 0;
    const escopo = parsed.altera_escopo ?? false;

    const gerente = alcadas.find((a) => a.nivel_decisor === "GERENTE");
    const patroc = alcadas.find((a) => a.nivel_decisor === "PATROCINADOR");

    let governanceLevel = "COMITE";
    if (
      gerente &&
      (!escopo || gerente.pode_alterar_escopo === "SIM") &&
      (gerente.limite_custo_rs === null || custo <= gerente.limite_custo_rs) &&
      (gerente.limite_prazo_du === null || prazo <= gerente.limite_prazo_du)
    ) {
      governanceLevel = "GERENTE";
    } else if (
      patroc &&
      (!escopo || patroc.pode_alterar_escopo === "SIM") &&
      (patroc.limite_custo_rs === null || custo <= patroc.limite_custo_rs) &&
      (patroc.limite_prazo_du === null || prazo <= patroc.limite_prazo_du)
    ) {
      governanceLevel = "PATROCINADOR";
    }

    const inserted = await query<{ id: string; created_at: string }>(
      `INSERT INTO lume_agent.agent_actions (conversation_id, action_type, payload, governance_level, status)
       VALUES ($1, $2, $3::jsonb, $4, 'registrada')
       RETURNING id, created_at::text`,
      [ctx.conversationId, parsed.tipo_acao, JSON.stringify(parsed), governanceLevel]
    );

    return {
      output: {
        ok: true,
        action_id: inserted[0]?.id,
        created_at: inserted[0]?.created_at,
        governance_level: governanceLevel,
        nota: "Solicitação registrada com sucesso.",
        payload: parsed,
      },
      cacheHit: false,
      ragChunks: 0,
      actionCreated: true,
    };
  }

  if (name === "buscar_documentacao_lume") {
    const consulta = String(rawArgs.consulta ?? "");
    const limite = typeof rawArgs.limite === "number" ? rawArgs.limite : 5;
    const rag = await searchKnowledgeBase(consulta, limite, ctx.dataFingerprint);
    return {
      output: {
        total_trechos: rag.hits.length,
        trechos: rag.hits.map((h) => ({
          arquivo: h.source_file,
          secao: h.section_title,
          similaridade: Number(h.similarity.toFixed(3)),
          conteudo: h.content,
        })),
      },
      cacheHit: rag.cacheHit,
      ragChunks: rag.hits.length,
      actionCreated: false,
    };
  }

  // Remaining tools are cached read-only queries bound to dataFingerprint
  const cached = await getToolCache<Record<string, unknown>>(
    name,
    rawArgs,
    ctx.dataFingerprint
  );
  if (cached.hit) {
    return {
      output: cached.payload,
      cacheHit: true,
      ragChunks: 0,
      actionCreated: false,
    };
  }

  let payload: Record<string, unknown> = {};

  switch (name) {
    case "consultar_metricas_fluxo_agil": {
      const corte = String(rawArgs.corte ?? "ATUAL");
      const incluirSerie = Boolean(rawArgs.incluir_serie_sprints ?? true);

      const resumo = await queryReadOnly(
        `SELECT * FROM lume_educacao.vw_fluxo_agil_dora WHERE corte_codigo = $1`,
        [corte]
      );
      const controles = await queryReadOnly(
        `SELECT ordem, codigo, metrica, ate_2026_11_13, atual_dinamico, status_13_11 FROM lume_educacao.vw_numeros_controle ORDER BY ordem`
      );
      const dora = await queryReadOnly(
        `SELECT * FROM lume_educacao.vw_dora_qualidade WHERE corte_codigo = $1 ORDER BY escopo_ambiente`,
        [corte]
      );

      let sprints: unknown[] = [];
      let releases: unknown[] = [];
      if (incluirSerie) {
        sprints = await queryReadOnly(
          `SELECT id_sprint, numero, dias_uteis, pts_comprometidos, velocidade_pts, taxa_conclusao_pct, velocidade_media_5_ultimas, vazao_itens_por_du, cycle_time_medio_du, lead_time_medio_du, wip_medio_little, wip_diario_medio_observado, aderencia_revisao_par_pct FROM lume_educacao.vw_velocidade_sprints ORDER BY numero`
        );
        releases = await queryReadOnly(
          `SELECT * FROM lume_educacao.vw_previsao_releases WHERE corte_codigo = $1 ORDER BY id_release`,
          [corte]
        );
      }

      payload = {
        fonte: "lume_educacao.vw_fluxo_agil_dora, vw_dora_qualidade, vw_numeros_controle, vw_velocidade_sprints, vw_previsao_releases",
        corte,
        resumo: resumo[0] ?? null,
        dora_por_ambiente: dora,
        controles_13: controles,
        releases,
        sprints,
      };
      break;
    }

    case "consultar_evm_custos": {
      const frente = String(rawArgs.frente ?? "TODAS").toUpperCase();
      const evm =
        frente === "TODAS"
          ? await queryReadOnly(`SELECT * FROM lume_educacao.vw_evm_resumo`)
          : await queryReadOnly(
              `SELECT * FROM lume_educacao.vw_evm_resumo WHERE frente = $1`,
              [frente]
            );
      const categorias = await queryReadOnly(
        `SELECT frente, categoria_custo, COUNT(*)::integer AS qtd, ROUND(SUM(valor_rs)::numeric, 2) AS total_rs
         FROM lume_educacao.custos_realizados
         GROUP BY frente, categoria_custo
         ORDER BY frente, total_rs DESC`
      );
      payload = {
        fonte: "lume_educacao.vw_evm_resumo e custos_realizados",
        evm,
        custos_por_categoria: categorias,
      };
      break;
    }

    case "consultar_riscos_reservas_alcadas": {
      const incluirSms = Boolean(rawArgs.incluir_lista_sms ?? false);
      const [resumo] = await queryReadOnly(
        `SELECT * FROM lume_educacao.vw_riscos_reservas_alcadas`
      );
      let mudancas: unknown[] = [];
      if (incluirSms) {
        mudancas = await queryReadOnly(
          `SELECT id_mudanca, data_abertura, id_solicitante, descricao, tipo_mudanca, frente, impacto_custo_rs, impacto_prazo_du, impacto_pontos, status, nivel_decisor, implementada FROM lume_educacao.mudancas_solicitacoes ORDER BY id_mudanca`
        );
      }
      payload = {
        fonte: "lume_educacao.vw_riscos_reservas_alcadas e mudancas_solicitacoes",
        resumo: resumo ?? null,
        mudancas_solicitacoes: mudancas,
      };
      break;
    }

    case "consultar_piloto_okrs_cenarios": {
      const idCenario = rawArgs.id_cenario ? String(rawArgs.id_cenario).toUpperCase() : null;
      const okrs = await queryReadOnly(
        `SELECT * FROM lume_educacao.vw_piloto_okrs_resumo`
      );
      const funilRecente = await queryReadOnly(
        `SELECT semana_inicio, alcance, cadastros, ativados, ativos_na_semana, retidos_4_semanas, receita_rs, nps, chamados_suporte
         FROM lume_educacao.funil_piloto_semanal
         ORDER BY semana_inicio DESC
         LIMIT 6`
      );
      const cenarios = idCenario
        ? await queryReadOnly(
            `SELECT * FROM lume_educacao.vw_cenarios_base WHERE id_cenario = $1`,
            [idCenario]
          )
        : await queryReadOnly(`SELECT * FROM lume_educacao.vw_cenarios_base ORDER BY id_cenario`);

      payload = {
        fonte: "lume_educacao.vw_piloto_okrs_resumo, funil_piloto_semanal e vw_cenarios_base",
        okrs_e_ultimo_funil: okrs,
        funil_ultimas_6_semanas: funilRecente,
        cenarios,
      };
      break;
    }

    case "consultar_equipe_e_backlog": {
      const idItem = rawArgs.id_item ? String(rawArgs.id_item).toUpperCase() : null;
      const idSprint = rawArgs.id_sprint ? String(rawArgs.id_sprint).toUpperCase() : null;
      const origem = rawArgs.origem ? String(rawArgs.origem).toUpperCase() : null;
      const incluirEquipe = rawArgs.incluir_equipe !== false;

      let equipe: unknown[] = [];
      if (incluirEquipe) {
        equipe = await queryReadOnly(
          `SELECT * FROM lume_educacao.vw_equipe_produtividade ORDER BY id_pessoa`
        );
      }

      const conditions: string[] = [];
      const params: unknown[] = [];
      if (idItem) {
        params.push(idItem);
        conditions.push(`id_item = $${params.length}`);
      }
      if (idSprint) {
        params.push(idSprint);
        conditions.push(`(id_sprint_atual = $${params.length} OR id_sprint_conclusao = $${params.length})`);
      }
      if (origem) {
        params.push(origem);
        conditions.push(`origem = $${params.length}`);
      }
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      const itens = await queryReadOnly(
        `SELECT id_item, id_epico, tipo_item, titulo, pontos, prioridade_moscow, id_release, origem, status, id_sprint_atual, id_sprint_conclusao, id_responsavel, revisao_por_par, cycle_time_du, lead_time_du, reprovacoes_teste, qtd_impedimentos, defeitos_originados
         FROM lume_educacao.vw_lead_cycle_time_itens
         ${whereClause}
         ORDER BY data_criacao DESC
         LIMIT 35`,
        params
      );

      payload = {
        fonte: "lume_educacao.vw_equipe_produtividade e vw_lead_cycle_time_itens",
        equipe,
        itens_backlog: itens,
      };
      break;
    }

    default:
      throw new Error(`Ferramenta desconhecida: ${name}`);
  }

  await setToolCache(name, rawArgs, ctx.dataFingerprint, payload);

  return {
    output: payload,
    cacheHit: false,
    ragChunks: 0,
    actionCreated: false,
  };
}
