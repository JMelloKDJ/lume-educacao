"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Moon,
  Plus,
  Send,
  Sparkles,
  Sun,
} from "lucide-react";
import { MarkdownBubble } from "@/components/MarkdownBubble";

interface ChatItem {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface OutboxRow {
  id: string;
  turn_id: string;
  seq: number;
  content: string;
  created_at: string;
}

interface LiveStatus {
  dataStatus: string;
  controlesOk: number;
  controlesTotal: number;
}

const SUGGESTED_PROMPTS = [
  "Qual cenário (C1–C6) o Comitê Diretor deve aprovar e por quê?",
  "Como estão M5, DORA e previsão da Release 2 hoje?",
  "As reservas cobrem os riscos abertos? Onde está o scope creep?",
  "Quero abrir uma SM para mitigar o R15 com R$ 8.000",
];

export default function LumeChatPage() {
  const [dark, setDark] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [items, setItems] = useState<ChatItem[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [liveStatus, setLiveStatus] = useState<LiveStatus | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const seenOutboxIdsRef = useRef<Set<string>>(new Set());
  const convIdRef = useRef<string | null>(null);
  const sendQueueRef = useRef<Promise<void>>(Promise.resolve());
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items, isTyping]);

  useEffect(() => {
    fetch("/api/chat")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.liveStatus) setLiveStatus(data.liveStatus);
      })
      .catch(() => {
        // ignore initial status fetch errors
      });
  }, []);

  const syncConversation = useCallback(async (cid: string) => {
    try {
      const res = await fetch(`/api/chat?conversationId=${encodeURIComponent(cid)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.liveStatus) setLiveStatus(data.liveStatus);
      setIsTyping(Boolean(data.isTyping));

      const incoming: OutboxRow[] = Array.isArray(data.outbox) ? data.outbox : [];
      const fresh = incoming.filter((row) => !seenOutboxIdsRef.current.has(row.id));

      if (fresh.length > 0) {
        fresh.forEach((row) => seenOutboxIdsRef.current.add(row.id));
        setItems((prev) => [
          ...prev,
          ...fresh.map((row) => ({
            id: row.id,
            role: "assistant" as const,
            content: row.content,
          })),
        ]);
      }
    } catch {
      // retry on next poll tick
    }
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    if (!isTyping) return;

    const timer = setInterval(() => {
      void syncConversation(conversationId);
    }, 650);

    return () => clearInterval(timer);
  }, [conversationId, isTyping, syncConversation]);

  const sendMessage = useCallback(
    (textToSend?: string) => {
      const text = (textToSend ?? input).trim();
      if (!text) return;

      if (!textToSend) setInput("");
      setErrorMsg(null);
      setIsTyping(true);

      const localId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setItems((prev) => [...prev, { id: localId, role: "user", content: text }]);

      sendQueueRef.current = sendQueueRef.current.then(async () => {
        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              conversationId: convIdRef.current,
              message: text,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            setErrorMsg(data.error || "Falha ao enviar mensagem.");
            setIsTyping(false);
            return;
          }
          if (data.conversationId && convIdRef.current !== data.conversationId) {
            convIdRef.current = data.conversationId;
            setConversationId(data.conversationId);
          }
          if (data.conversationId) {
            await syncConversation(data.conversationId);
          }
        } catch (err) {
          setErrorMsg(err instanceof Error ? err.message : "Erro de rede.");
          setIsTyping(false);
        }
      });
    },
    [input, syncConversation]
  );

  const resetConversation = () => {
    convIdRef.current = null;
    seenOutboxIdsRef.current = new Set();
    setConversationId(null);
    setItems([]);
    setIsTyping(false);
    setErrorMsg(null);
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "var(--canvas)",
        color: "var(--ink)",
      }}
    >
      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backdropFilter: "blur(18px)",
          background: "var(--glass)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            maxWidth: "960px",
            margin: "0 auto",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "14px",
                background: "linear-gradient(135deg, #7C5CFC, #FF7A59)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                boxShadow: "var(--shadow-float)",
              }}
            >
              <Sparkles size={19} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="font-display" style={{ fontWeight: 700, fontSize: "16px" }}>
                  Lume Educação · Copiloto IA
                </span>
                <span
                  className="font-mono"
                  style={{
                    fontSize: "11px",
                    padding: "2px 8px",
                    borderRadius: "var(--radius-pill)",
                    background: "var(--lavender-50)",
                    color: "var(--lavender-600)",
                    border: "1px solid var(--lavender-200)",
                  }}
                >
                  LE-15 / R13
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)" }}>
                Conectado ao Supabase ({liveStatus ? `corte ${liveStatus.dataStatus} · ${liveStatus.controlesOk}/${liveStatus.controlesTotal} controles OK` : "carregando status..."})
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Link
              href="/telemetry"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 12px",
                borderRadius: "var(--radius-pill)",
                border: "1px solid var(--border)",
                background: "var(--card)",
                color: "var(--ink)",
                fontSize: "12.5px",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              <Activity size={14} />
              Telemetria
            </Link>

            <button
              type="button"
              onClick={resetConversation}
              title="Nova conversa"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 12px",
                borderRadius: "var(--radius-pill)",
                border: "1px solid var(--border)",
                background: "var(--card)",
                color: "var(--ink)",
                fontSize: "12.5px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <Plus size={14} />
              Nova
            </button>

            <button
              type="button"
              onClick={() => setDark((d) => !d)}
              aria-label="Alternar tema"
              style={{
                width: 34,
                height: 34,
                borderRadius: "var(--radius-pill)",
                border: "1px solid var(--border)",
                background: "var(--card)",
                color: "var(--ink)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main chat timeline */}
      <main
        style={{
          flex: 1,
          width: "100%",
          maxWidth: "880px",
          margin: "0 auto",
          padding: "24px 20px 110px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {items.length === 0 && (
          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-card)",
              padding: "28px",
              boxShadow: "var(--shadow-soft)",
              marginTop: "20px",
            }}
          >
            <h1
              className="font-display"
              style={{ margin: "0 0 8px 0", fontSize: "22px", fontWeight: 700 }}
            >
              Assistente Executivo & Operacional da Lume Educação
            </h1>
            <p
              style={{
                margin: "0 0 20px 0",
                color: "var(--muted)",
                fontSize: "14.5px",
                lineHeight: 1.55,
              }}
            >
              Consulte métricas vivas (M5/DORA, EVM, riscos/reservas, alçadas, equipe, OKRs e cenários{" "}
              <code>C1–C6</code>), pesquise o Dossiê/Dicionário via RAG ou registre ações de governança.
              Você pode enviar várias mensagens em sequência sem esperar a resposta anterior.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "10px",
              }}
            >
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  style={{
                    textAlign: "left",
                    padding: "12px 14px",
                    borderRadius: "16px",
                    border: "1px solid var(--lavender-200)",
                    background: "var(--lavender-50)",
                    color: "var(--ink)",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                    lineHeight: 1.4,
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {items.map((item) => {
          const isUser = item.role === "user";
          return (
            <div
              key={item.id}
              style={{
                display: "flex",
                justifyContent: isUser ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "82%",
                  padding: "13px 17px",
                  borderRadius: isUser ? "20px 20px 6px 20px" : "20px 20px 20px 6px",
                  background: isUser
                    ? "linear-gradient(135deg, #7C5CFC, #6747E6)"
                    : "var(--card)",
                  color: isUser ? "#FFFFFF" : "var(--ink)",
                  border: isUser ? "none" : "1px solid var(--border)",
                  boxShadow: isUser ? "var(--shadow-float)" : "var(--shadow-soft)",
                }}
              >
                {isUser ? (
                  <p style={{ margin: 0, fontSize: "14.5px", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                    {item.content}
                  </p>
                ) : (
                  <MarkdownBubble content={item.content} />
                )}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "20px 20px 20px 6px",
                background: "var(--card)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-soft)",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ display: "inline-flex", gap: "4px", alignItems: "center" }}>
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </span>
              <span style={{ fontSize: "13px", color: "var(--muted)" }}>Digitando...</span>
            </div>
          </div>
        )}

        {errorMsg && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "14px",
              background: "var(--rose-50)",
              color: "var(--rose-500)",
              fontSize: "13px",
              border: "1px solid rgba(244,63,94,0.25)",
            }}
          >
            {errorMsg}
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      {/* Composer */}
      <footer
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          backdropFilter: "blur(18px)",
          background: "var(--glass)",
          borderTop: "1px solid var(--border)",
          padding: "12px 20px",
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          style={{
            maxWidth: "880px",
            margin: "0 auto",
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte sobre EVM, M5, riscos, cenários ou peça uma ação no sistema..."
            style={{
              flex: 1,
              padding: "13px 16px",
              borderRadius: "var(--radius-input)",
              border: "1px solid var(--border)",
              background: "var(--card)",
              color: "var(--ink)",
              fontSize: "14.5px",
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            style={{
              padding: "13px 20px",
              borderRadius: "var(--radius-pill)",
              border: "none",
              background: input.trim()
                ? "linear-gradient(135deg, #7C5CFC, #6747E6)"
                : "var(--border)",
              color: input.trim() ? "#FFFFFF" : "var(--muted)",
              fontWeight: 600,
              fontSize: "14px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              cursor: input.trim() ? "pointer" : "not-allowed",
              boxShadow: input.trim() ? "var(--shadow-float)" : "none",
            }}
          >
            <Send size={15} />
            Enviar
          </button>
        </form>
      </footer>
    </div>
  );
}
