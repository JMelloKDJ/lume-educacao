import { after, NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDataFingerprint, query } from "@/lib/db";
import {
  enqueueUserMessage,
  processConversationTurn,
} from "@/lib/agent/worker";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const postBodySchema = z.object({
  conversationId: z.string().uuid().optional().nullable(),
  message: z.string().trim().min(1, "Mensagem não pode ser vazia.").max(4000),
  sync: z.boolean().optional(),
  screenContext: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = postBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload inválido", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { conversationId, message, sync, screenContext } = parsed.data;
    const isSync =
      Boolean(sync) || req.nextUrl.searchParams.get("sync") === "1";

    const enq = await enqueueUserMessage(conversationId, message);

    if (isSync) {
      const turnResult = await processConversationTurn(enq.conversationId, enq.jobId, {
        skipDebounce: true,
        screenContext,
      });
      const outbox = await query<{
        id: string;
        turn_id: string;
        seq: number;
        content: string;
        created_at: string;
      }>(
        `SELECT id, turn_id, seq, content, created_at::text
         FROM lume_agent.outbox_messages
         WHERE conversation_id = $1 AND turn_id = $2
         ORDER BY seq ASC`,
        [enq.conversationId, enq.jobId]
      );
      return NextResponse.json(
        {
          conversationId: enq.conversationId,
          jobId: enq.jobId,
          state: "completed_sync",
          messages: outbox,
          uiActions: turnResult.uiActions,
          dataMutated: turnResult.dataMutated,
        },
        { status: 200 }
      );
    }

    if (enq.shouldSchedule) {
      after(async () => {
        await processConversationTurn(enq.conversationId, enq.jobId, {
          screenContext,
        });
      });
    }

    return NextResponse.json(
      {
        conversationId: enq.conversationId,
        jobId: enq.jobId,
        state: enq.state,
      },
      { status: 202 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro interno em /api/chat";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const conversationId = req.nextUrl.searchParams.get("conversationId");
    const liveStatus = await getDataFingerprint();

    if (!conversationId) {
      return NextResponse.json({
        liveStatus: {
          dataStatus: liveStatus.dataStatus,
          controlesOk: liveStatus.controlesOk,
          controlesTotal: liveStatus.controlesTotal,
        },
      });
    }

    const validId = z.string().uuid().safeParse(conversationId);
    if (!validId.success) {
      return NextResponse.json(
        { error: "conversationId inválido" },
        { status: 400 }
      );
    }

    const [typingRow] = await query<{ is_typing: boolean }>(
      `SELECT (
         EXISTS (
           SELECT 1 FROM lume_agent.turn_jobs
           WHERE conversation_id = $1 AND status IN ('debouncing', 'running')
         )
         OR EXISTS (
           SELECT 1 FROM lume_agent.messages
           WHERE conversation_id = $1 AND role = 'user' AND processed = false
         )
       ) AS is_typing`,
      [conversationId]
    );

    const userMessages = await query<{
      id: string;
      content: string;
      created_at: string;
    }>(
      `SELECT id, content, created_at::text
       FROM lume_agent.messages
       WHERE conversation_id = $1 AND role = 'user'
       ORDER BY created_at ASC`,
      [conversationId]
    );

    const outbox = await query<{
      id: string;
      turn_id: string;
      seq: number;
      content: string;
      created_at: string;
    }>(
      `SELECT id, turn_id, seq, content, created_at::text
       FROM lume_agent.outbox_messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC, seq ASC`,
      [conversationId]
    );

    const timeline = [
      ...userMessages.map((m) => ({
        id: m.id,
        role: "user" as const,
        content: m.content,
        created_at: m.created_at,
        seq: 0,
        orderHint: 0,
      })),
      ...outbox.map((m) => ({
        id: m.id,
        role: "assistant" as const,
        content: m.content,
        created_at: m.created_at,
        seq: m.seq,
        orderHint: 1,
      })),
    ]
      .sort((a, b) => {
        const cmp = a.created_at.localeCompare(b.created_at);
        if (cmp !== 0) return cmp;
        if (a.orderHint !== b.orderHint) return a.orderHint - b.orderHint;
        return a.seq - b.seq;
      })
      .map(({ id, role, content, created_at }) => ({
        id,
        role,
        content,
        created_at,
      }));

    const actions = await query<{
      id: string;
      action_type: string;
      governance_level: string;
      status: string;
      payload: Record<string, unknown>;
      created_at: string;
    }>(
      `SELECT id, action_type, governance_level, status, payload, created_at::text
       FROM lume_agent.agent_actions
       WHERE conversation_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [conversationId]
    );

    return NextResponse.json({
      conversationId,
      isTyping: Boolean(typingRow?.is_typing),
      outbox,
      timeline,
      actions,
      liveStatus: {
        dataStatus: liveStatus.dataStatus,
        controlesOk: liveStatus.controlesOk,
        controlesTotal: liveStatus.controlesTotal,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao consultar conversa";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
