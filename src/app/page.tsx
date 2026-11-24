"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Activity, Moon, Plus, Send, Sun } from "lucide-react";
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

const SUGGESTED_PROMPTS = [
  "Como estão o prazo e o orçamento do projeto hoje?",
  "Qual decisão você recomenda para o comitê?",
  "Quais são os principais riscos abertos no momento?",
  "Quero registrar uma proposta de mudança para avaliação",
];

export default function LumeChatPage() {
  const [dark, setDark] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [items, setItems] = useState<ChatItem[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
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

  const syncConversation = useCallback(async (cid: string) => {
    try {
      const res = await fetch(`/api/chat?conversationId=${encodeURIComponent(cid)}`);
      if (!res.ok) return;
      const data = await res.json();
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
    if (!conversationId || !isTyping) return;

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
          backdropFilter: "blur(16px)",
          background: "var(--glass)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            maxWidth: "820px",
            margin: "0 auto",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "10px",
                background: "#081628",
                border: "1px solid rgba(201, 162, 39, 0.55)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: "15px",
                letterSpacing: "-0.02em",
                flexShrink: 0,
              }}
              className="font-display"
            >
              L
            </div>
            <span
              className="font-display"
              style={{ fontWeight: 700, fontSize: "16px", letterSpacing: "-0.01em" }}
            >
              Lume Educação
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              onClick={resetConversation}
              className="lume-btn-ghost"
            >
              <Plus size={15} />
              <span>Nova conversa</span>
            </button>

            <button
              type="button"
              onClick={() => setDark((d) => !d)}
              aria-label="Alternar tema"
              title="Alternar tema"
              className="lume-btn-ghost lume-icon-btn"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <Link
              href="/telemetry"
              aria-label="Telemetria"
              title="Telemetria"
              className="lume-btn-ghost lume-icon-btn"
            >
              <Activity size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main chat timeline */}
      <main
        style={{
          flex: 1,
          width: "100%",
          maxWidth: "820px",
          margin: "0 auto",
          padding: "24px 16px 112px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {items.length === 0 && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "24px 0",
              gap: "24px",
            }}
          >
            <h1
              className="font-display"
              style={{
                margin: 0,
                fontSize: "clamp(1.375rem, 3.2vw, 1.75rem)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--ink)",
                textAlign: "center",
              }}
            >
              Como posso ajudar hoje?
            </h1>

            <div className="lume-suggestion-grid">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="lume-suggestion-card"
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
                  maxWidth: "84%",
                  padding: "12px 16px",
                  borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: isUser ? "var(--user-bubble)" : "var(--card)",
                  color: isUser ? "var(--user-bubble-ink)" : "var(--ink)",
                  border: isUser ? "none" : "1px solid var(--border)",
                  boxShadow: "var(--shadow-subtle)",
                }}
              >
                {isUser ? (
                  <p
                    style={{
                      margin: 0,
                      fontSize: "15px",
                      lineHeight: 1.55,
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                    }}
                  >
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
                padding: "11px 15px",
                borderRadius: "16px 16px 16px 4px",
                background: "var(--card)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-subtle)",
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
              <span style={{ fontSize: "13.5px", color: "var(--muted)" }}>Digitando...</span>
            </div>
          </div>
        )}

        {errorMsg && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "12px",
              background: "var(--danger-bg)",
              color: "var(--danger-ink)",
              fontSize: "13.5px",
              border: "1px solid var(--border)",
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
          backdropFilter: "blur(16px)",
          background: "var(--glass)",
          borderTop: "1px solid var(--border)",
          padding: "12px 16px max(12px, env(safe-area-inset-bottom))",
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          style={{
            maxWidth: "820px",
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
            placeholder="Digite sua mensagem..."
            aria-label="Mensagem"
            className="lume-composer-input"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="lume-send-btn"
          >
            <Send size={15} />
            <span>Enviar</span>
          </button>
        </form>
      </footer>
    </div>
  );
}
