import { NextResponse } from "next/server";
import { getDataFingerprint, query, queryReadOnly } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const liveStatus = await getDataFingerprint();

    const [agg] = await queryReadOnly<{
      total_turnos: number;
      turnos_ok: number;
      turnos_erro: number;
      escalamentos_flash: number;
      cache_hits_total: number;
      media_total_ms: number;
      p95_total_ms: number;
      tokens_in_total: number;
      tokens_out_total: number;
    }>(`
      SELECT
        COUNT(*)::integer AS total_turnos,
        COUNT(*) FILTER (WHERE status = 'completed')::integer AS turnos_ok,
        COUNT(*) FILTER (WHERE status = 'error')::integer AS turnos_erro,
        COUNT(*) FILTER (WHERE escalated_to_flash)::integer AS escalamentos_flash,
        COALESCE(SUM(cache_hits), 0)::integer AS cache_hits_total,
        COALESCE(ROUND(AVG(total_ms)), 0)::integer AS media_total_ms,
        COALESCE(ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY total_ms)), 0)::integer AS p95_total_ms,
        COALESCE(SUM(tokens_in), 0)::integer AS tokens_in_total,
        COALESCE(SUM(tokens_out), 0)::integer AS tokens_out_total
      FROM lume_agent.turn_telemetry
    `);

    const turns = await query(
      `SELECT id, conversation_id, turn_id, status, messages_coalesced, model_primary,
              escalated_to_flash, escalation_reason, cache_hits, rag_chunks_count,
              tools_called, actions_created, outbox_bubbles_count,
              debounce_ms, rag_ms, tools_ms, llm_ms, total_ms, tokens_in, tokens_out,
              error_message, created_at::text
       FROM lume_agent.turn_telemetry
       ORDER BY created_at DESC
       LIMIT 40`
    );

    const actions = await query(
      `SELECT id, conversation_id, action_type, governance_level, status, payload, created_at::text
       FROM lume_agent.agent_actions
       ORDER BY created_at DESC
       LIMIT 30`
    );

    const ragDocs = await queryReadOnly<{
      source_file: string;
      chunks: number;
    }>(
      `SELECT source_file, COUNT(*)::integer AS chunks
       FROM lume_agent.knowledge_chunks
       GROUP BY source_file
       ORDER BY source_file`
    );

    return NextResponse.json({
      liveStatus: {
        dataStatus: liveStatus.dataStatus,
        controlesOk: liveStatus.controlesOk,
        controlesTotal: liveStatus.controlesTotal,
      },
      summary: agg ?? null,
      turns,
      actions,
      ragDocs,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao carregar telemetria";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
