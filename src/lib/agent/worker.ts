import type { Content, FunctionDeclaration, Part } from "@google/genai";
import { getDataFingerprint, query } from "../db";
import { AGENT_MANIFEST, SYSTEM_PROMPT } from "./manifest";
import { getGenAI } from "./rag";
import {
  ACTION_TOOLS_WITHOUT_DELEGATE,
  TOOL_DECLARATIONS,
  executeToolCall,
} from "./tools";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function parseAgentMessages(rawText: string | undefined): string[] {
  const cleaned = (rawText ?? "").trim();
  if (!cleaned) {
    return ["Não consegui formular uma resposta agora. Pode repetir sua pergunta?"];
  }

  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1].trim() : cleaned;

  try {
    const parsed = JSON.parse(candidate) as { messages?: unknown };
    if (Array.isArray(parsed.messages)) {
      const list = parsed.messages
        .map((m) => (typeof m === "string" ? m.trim() : ""))
        .filter(Boolean)
        .slice(0, 3);
      if (list.length > 0) return list;
    }
  } catch {
    // Fallback below when model outputs plain prose
  }

  const paragraphs = cleaned
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length <= 1) return [cleaned];
  if (paragraphs.length <= 3) return paragraphs;
  return [paragraphs[0], paragraphs.slice(1).join("\n\n")];
}

export interface EnqueueResult {
  conversationId: string;
  jobId: string;
  shouldSchedule: boolean;
  state: "created" | "coalesced_debouncing" | "queued_for_delta_turn";
}

export async function enqueueUserMessage(
  conversationIdInput: string | null | undefined,
  content: string
): Promise<EnqueueResult> {
  let conversationId = conversationIdInput ?? null;

  if (conversationId) {
    const existing = await query<{ id: string }>(
      `SELECT id FROM lume_agent.conversations WHERE id = $1 LIMIT 1`,
      [conversationId]
    );
    if (existing.length === 0) {
      conversationId = null;
    }
  }

  if (!conversationId) {
    const title = content.slice(0, 80);
    const created = await query<{ id: string }>(
      `INSERT INTO lume_agent.conversations (title, status) VALUES ($1, 'active') RETURNING id`,
      [title]
    );
    conversationId = created[0].id;
  } else {
    await query(
      `UPDATE lume_agent.conversations SET status = 'active', updated_at = now() WHERE id = $1`,
      [conversationId]
    );
  }

  await query(
    `INSERT INTO lume_agent.messages (conversation_id, role, content, processed)
     VALUES ($1, 'user', $2, false)`,
    [conversationId, content]
  );

  const activeJobs = await query<{ id: string; status: string }>(
    `SELECT id, status
     FROM lume_agent.turn_jobs
     WHERE conversation_id = $1 AND status IN ('debouncing', 'running')
     ORDER BY created_at DESC
     LIMIT 1`,
    [conversationId]
  );

  if (activeJobs.length > 0) {
    const job = activeJobs[0];
    if (job.status === "debouncing") {
      await query(
        `UPDATE lume_agent.turn_jobs
         SET process_after = now() + ($2 || ' milliseconds')::interval
         WHERE id = $1`,
        [job.id, String(AGENT_MANIFEST.debounceMs)]
      );
      return {
        conversationId,
        jobId: job.id,
        shouldSchedule: false,
        state: "coalesced_debouncing",
      };
    }

    return {
      conversationId,
      jobId: job.id,
      shouldSchedule: false,
      state: "queued_for_delta_turn",
    };
  }

  const insertedJob = await query<{ id: string }>(
    `INSERT INTO lume_agent.turn_jobs (conversation_id, status, process_after)
     VALUES ($1, 'debouncing', now() + ($2 || ' milliseconds')::interval)
     RETURNING id`,
    [conversationId, String(AGENT_MANIFEST.debounceMs)]
  );

  return {
    conversationId,
    jobId: insertedJob[0].id,
    shouldSchedule: true,
    state: "created",
  };
}

interface AgentLoopStats {
  modelUsed: string;
  escalatedToFlash: boolean;
  escalationReason: string | null;
  cacheHits: number;
  ragChunks: number;
  actionsCreated: number;
  toolsCalled: Array<{ name: string; cacheHit: boolean; ms: number }>;
  toolsMs: number;
  ragMs: number;
  llmMs: number;
  tokensIn: number;
  tokensOut: number;
}

async function runModelLoop(params: {
  model: string;
  contents: Content[];
  tools: FunctionDeclaration[];
  conversationId: string;
  dataFingerprint: string;
  allowEscalation: boolean;
  stats: AgentLoopStats;
}): Promise<string[]> {
  const ai = getGenAI();
  const workingContents = [...params.contents];

  for (let round = 0; round < AGENT_MANIFEST.maxToolRounds; round++) {
    const llmStart = Date.now();
    const response = await ai.models.generateContent({
      model: params.model,
      contents: workingContents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ functionDeclarations: params.tools }],
        temperature: 0.2,
      },
    });
    params.stats.llmMs += Date.now() - llmStart;
    params.stats.tokensIn += response.usageMetadata?.promptTokenCount ?? 0;
    params.stats.tokensOut += response.usageMetadata?.candidatesTokenCount ?? 0;

    const calls = response.functionCalls;
    if (!calls || calls.length === 0) {
      return parseAgentMessages(response.text);
    }

    // Push model response turn into conversation contents
    const modelParts: Part[] = response.candidates?.[0]?.content?.parts ?? [];
    if (modelParts.length > 0) {
      workingContents.push({ role: "model", parts: modelParts });
    }

    // Check if the agent autonomously decided to escalate to Flash
    const escalateCall = params.allowEscalation
      ? calls.find((c) => c.name === "delegate_complex_analysis")
      : undefined;

    if (escalateCall) {
      const args = (escalateCall.args ?? {}) as Record<string, unknown>;
      params.stats.escalatedToFlash = true;
      params.stats.escalationReason = String(
        args.motivo_escalonamento ?? "Escalonamento autônomo do agente"
      );
      params.stats.modelUsed = AGENT_MANIFEST.models.deep;
      params.stats.toolsCalled.push({
        name: "delegate_complex_analysis",
        cacheHit: false,
        ms: 0,
      });

      const handoffNote = [
        `[Escalonamento autônomo de ${AGENT_MANIFEST.models.primary} para ${AGENT_MANIFEST.models.deep}]`,
        `Motivo: ${params.stats.escalationReason}`,
        `Pergunta consolidada: ${String(args.pergunta_consolidada ?? "")}`,
        args.evidencias_coletadas
          ? `Evidências já coletadas: ${String(args.evidencias_coletadas)}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");

      const escalatedContents: Content[] = [
        ...params.contents,
        { role: "user", parts: [{ text: handoffNote }] },
      ];

      return runModelLoop({
        model: AGENT_MANIFEST.models.deep,
        contents: escalatedContents,
        tools: ACTION_TOOLS_WITHOUT_DELEGATE,
        conversationId: params.conversationId,
        dataFingerprint: params.dataFingerprint,
        allowEscalation: false,
        stats: params.stats,
      });
    }

    // Execute requested tools deterministically/parallel
    const responseParts: Part[] = [];
    for (const call of calls) {
      const toolName = call.name ?? "";
      const toolStart = Date.now();
      try {
        const res = await executeToolCall(
          toolName,
          (call.args ?? {}) as Record<string, unknown>,
          {
            conversationId: params.conversationId,
            dataFingerprint: params.dataFingerprint,
          }
        );
        const ms = Date.now() - toolStart;
        if (toolName === "buscar_documentacao_lume") {
          params.stats.ragMs += ms;
        } else {
          params.stats.toolsMs += ms;
        }
        if (res.cacheHit) params.stats.cacheHits += 1;
        if (res.actionCreated) params.stats.actionsCreated += 1;
        params.stats.ragChunks += res.ragChunks;
        params.stats.toolsCalled.push({
          name: toolName,
          cacheHit: res.cacheHit,
          ms,
        });

        responseParts.push({
          functionResponse: {
            id: call.id,
            name: toolName,
            response: { output: res.output },
          },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao executar tool";
        const ms = Date.now() - toolStart;
        params.stats.toolsCalled.push({
          name: toolName,
          cacheHit: false,
          ms,
        });
        responseParts.push({
          functionResponse: {
            id: call.id,
            name: toolName,
            response: { error: message },
          },
        });
      }
    }

    workingContents.push({ role: "user", parts: responseParts });
  }

  return [
    "Atingi o limite de consultas em cadeia neste turno. Pode reformular ou pedir um foco específico?",
  ];
}

export async function processConversationTurn(
  conversationId: string,
  initialJobId: string,
  options?: { skipDebounce?: boolean }
): Promise<void> {
  let currentJobId = initialJobId;

  while (true) {
    const turnStart = Date.now();
    let debounceMsActual = 0;

    if (!options?.skipDebounce) {
      const debounceStart = Date.now();
      while (true) {
        const jobs = await query<{ status: string; remaining_ms: number }>(
          `SELECT status,
                  GREATEST(0, EXTRACT(EPOCH FROM (process_after - now())) * 1000)::integer AS remaining_ms
           FROM lume_agent.turn_jobs
           WHERE id = $1
           LIMIT 1`,
          [currentJobId]
        );

        if (jobs.length === 0 || jobs[0].status !== "debouncing") {
          return;
        }
        if (jobs[0].remaining_ms <= 20) {
          break;
        }
        await sleep(Math.min(jobs[0].remaining_ms, 2500));
      }
      debounceMsActual = Date.now() - debounceStart;
    }

    const claimed = await query<{ id: string }>(
      `UPDATE lume_agent.turn_jobs
       SET status = 'running'
       WHERE id = $1 AND status = 'debouncing'
       RETURNING id`,
      [currentJobId]
    );
    if (claimed.length === 0) {
      return;
    }

    await query(
      `UPDATE lume_agent.conversations SET active_turn_id = $2, updated_at = now() WHERE id = $1`,
      [conversationId, currentJobId]
    );

    const pendingUsers = await query<{ id: string; content: string; created_at: string }>(
      `WITH target AS (
         SELECT id
         FROM lume_agent.messages
         WHERE conversation_id = $1 AND role = 'user' AND processed = false
         ORDER BY created_at ASC
       )
       UPDATE lume_agent.messages m
       SET processed = true, turn_id = $2
       FROM target
       WHERE m.id = target.id
       RETURNING m.id, m.content, m.created_at::text`,
      [conversationId, currentJobId]
    );
    pendingUsers.sort((a, b) => a.created_at.localeCompare(b.created_at));

    if (pendingUsers.length === 0) {
      await query(
        `UPDATE lume_agent.turn_jobs SET status = 'completed', completed_at = now() WHERE id = $1`,
        [currentJobId]
      );
      break;
    }

    const stats: AgentLoopStats = {
      modelUsed: AGENT_MANIFEST.models.primary,
      escalatedToFlash: false,
      escalationReason: null,
      cacheHits: 0,
      ragChunks: 0,
      actionsCreated: 0,
      toolsCalled: [],
      toolsMs: 0,
      ragMs: 0,
      llmMs: 0,
      tokensIn: 0,
      tokensOut: 0,
    };

    try {
      const pendingIds = pendingUsers.map((m) => m.id);
      const historyRows = await query<{ role: string; content: string }>(
        `SELECT role, content
         FROM lume_agent.messages
         WHERE conversation_id = $1
           AND NOT (id = ANY($2::uuid[]))
         ORDER BY created_at DESC
         LIMIT $3`,
        [conversationId, pendingIds, AGENT_MANIFEST.historyLimit]
      );
      historyRows.reverse();

      const contents: Content[] = historyRows.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const coalescedInput =
        pendingUsers.length === 1
          ? pendingUsers[0].content
          : pendingUsers.map((m, idx) => `[Mensagem ${idx + 1}] ${m.content}`).join("\n");

      contents.push({ role: "user", parts: [{ text: coalescedInput }] });

      const fp = await getDataFingerprint();
      const outBubbles = await runModelLoop({
        model: AGENT_MANIFEST.models.primary,
        contents,
        tools: TOOL_DECLARATIONS,
        conversationId,
        dataFingerprint: fp.fingerprint,
        allowEscalation: true,
        stats,
      });

      for (let i = 0; i < outBubbles.length; i++) {
        await query(
          `INSERT INTO lume_agent.outbox_messages (conversation_id, turn_id, seq, content)
           VALUES ($1, $2, $3, $4)`,
          [conversationId, currentJobId, i + 1, outBubbles[i]]
        );
      }

      await query(
        `INSERT INTO lume_agent.messages (conversation_id, role, content, turn_id, processed)
         VALUES ($1, 'assistant', $2, $3, true)`,
        [conversationId, outBubbles.join("\n\n"), currentJobId]
      );

      await query(
        `UPDATE lume_agent.turn_jobs
         SET status = 'completed', model_used = $2, completed_at = now()
         WHERE id = $1`,
        [currentJobId, stats.modelUsed]
      );

      await query(
        `INSERT INTO lume_agent.turn_telemetry (
          conversation_id, turn_id, status, messages_coalesced, model_primary,
          escalated_to_flash, escalation_reason, cache_hits, rag_chunks_count,
          tools_called, actions_created, outbox_bubbles_count,
          debounce_ms, rag_ms, tools_ms, llm_ms, total_ms, tokens_in, tokens_out
        ) VALUES ($1,$2,'completed',$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
        [
          conversationId,
          currentJobId,
          pendingUsers.length,
          AGENT_MANIFEST.models.primary,
          stats.escalatedToFlash,
          stats.escalationReason,
          stats.cacheHits,
          stats.ragChunks,
          JSON.stringify(stats.toolsCalled),
          stats.actionsCreated,
          outBubbles.length,
          debounceMsActual,
          stats.ragMs,
          stats.toolsMs,
          stats.llmMs,
          Date.now() - turnStart,
          stats.tokensIn,
          stats.tokensOut,
        ]
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido no turno";
      await query(
        `UPDATE lume_agent.turn_jobs SET status = 'error', completed_at = now() WHERE id = $1`,
        [currentJobId]
      );
      await query(
        `INSERT INTO lume_agent.outbox_messages (conversation_id, turn_id, seq, content)
         VALUES ($1, $2, 1, $3)`,
        [
          conversationId,
          currentJobId,
          "Ocorreu um erro ao consultar o modelo de IA. Verifique `GEMINI_API_KEY` e a telemetria em `/telemetry`.",
        ]
      );
      await query(
        `INSERT INTO lume_agent.turn_telemetry (
          conversation_id, turn_id, status, messages_coalesced, model_primary,
          escalated_to_flash, escalation_reason, cache_hits, rag_chunks_count,
          tools_called, actions_created, outbox_bubbles_count,
          debounce_ms, rag_ms, tools_ms, llm_ms, total_ms, tokens_in, tokens_out, error_message
        ) VALUES ($1,$2,'error',$3,$4,$5,$6,$7,$8,$9::jsonb,$10,1,$11,$12,$13,$14,$15,$16,$17,$18)`,
        [
          conversationId,
          currentJobId,
          pendingUsers.length,
          AGENT_MANIFEST.models.primary,
          stats.escalatedToFlash,
          stats.escalationReason,
          stats.cacheHits,
          stats.ragChunks,
          JSON.stringify(stats.toolsCalled),
          stats.actionsCreated,
          debounceMsActual,
          stats.ragMs,
          stats.toolsMs,
          stats.llmMs,
          Date.now() - turnStart,
          stats.tokensIn,
          stats.tokensOut,
          errorMessage,
        ]
      );
    }

    // Check if new user messages arrived while Turn 1 was running -> chain Delta Turn automatically!
    const deltaCheck = await query<{ cnt: string }>(
      `SELECT COUNT(*)::text AS cnt
       FROM lume_agent.messages
       WHERE conversation_id = $1 AND role = 'user' AND processed = false`,
      [conversationId]
    );

    if (Number(deltaCheck[0]?.cnt ?? "0") > 0) {
      const deltaJob = await query<{ id: string }>(
        `INSERT INTO lume_agent.turn_jobs (conversation_id, status, process_after)
         VALUES ($1, 'debouncing', now() + interval '400 milliseconds')
         RETURNING id`,
        [conversationId]
      );
      currentJobId = deltaJob[0].id;
      options = { skipDebounce: false };
      continue;
    }

    await query(
      `UPDATE lume_agent.conversations SET active_turn_id = NULL, status = 'idle', updated_at = now() WHERE id = $1`,
      [conversationId]
    );
    break;
  }
}
