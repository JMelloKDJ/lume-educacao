"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Box, ClipboardList, Moon, PanelLeft, Plus, Send, Sun, Trash2, X } from "lucide-react";
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

interface TimelineRow {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface SavedChat {
  id: string;
  title: string;
  updatedAt: string;
}

const HISTORY_STORAGE_KEY = "lume_chat_history_v1";
const ACTIVE_CHAT_STORAGE_KEY = "lume_active_chat_v1";
const MAX_SAVED_CHATS = 30;

const SUGGESTED_PROMPTS = [
  "Como estão o prazo e o orçamento do projeto hoje?",
  "Qual decisão você recomenda para o comitê?",
  "Quais são os principais riscos abertos no momento?",
  "Quero registrar uma proposta de mudança para avaliação",
];

function readSavedChats(): SavedChat[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (c): c is SavedChat =>
        c &&
        typeof c.id === "string" &&
        typeof c.title === "string" &&
        typeof c.updatedAt === "string"
    );
  } catch {
    return [];
  }
}

function writeSavedChats(chats: SavedChat[]) {
  try {
    window.localStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify(chats.slice(0, MAX_SAVED_CHATS))
    );
  } catch {
    // ignore storage quota errors
  }
}

function formatChatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export default function LumeChatPage() {
  const [dark, setDark] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [history, setHistory] = useState<SavedChat[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [items, setItems] = useState<ChatItem[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
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

  const upsertHistoryEntry = useCallback((id: string, titleCandidate?: string) => {
    const nowIso = new Date().toISOString();
    setHistory((prev) => {
      const existing = prev.find((c) => c.id === id);
      const title =
        existing?.title ??
        ((titleCandidate ?? "Conversa").trim().slice(0, 48) || "Conversa");
      const next = [
        { id, title, updatedAt: nowIso },
        ...prev.filter((c) => c.id !== id),
      ].slice(0, MAX_SAVED_CHATS);
      writeSavedChats(next);
      return next;
    });
  }, []);

  const loadConversationById = useCallback(async (cid: string) => {
    setLoadingChat(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/chat?conversationId=${encodeURIComponent(cid)}`);
      if (!res.ok) {
        setErrorMsg("Não foi possível carregar essa conversa.");
        return;
      }
      const data = await res.json();
      const outbox: OutboxRow[] = Array.isArray(data.outbox) ? data.outbox : [];
      const timeline: TimelineRow[] = Array.isArray(data.timeline)
        ? data.timeline
        : [];

      seenOutboxIdsRef.current = new Set(outbox.map((row) => row.id));
      convIdRef.current = cid;
      setConversationId(cid);
      setItems(
        timeline.map((row) => ({
          id: row.id,
          role: row.role,
          content: row.content,
        }))
      );
      setIsTyping(Boolean(data.isTyping));
      try {
        window.localStorage.setItem(ACTIVE_CHAT_STORAGE_KEY, cid);
      } catch {
        // ignore
      }
    } catch {
      setErrorMsg("Erro de rede ao carregar conversa.");
    } finally {
      setLoadingChat(false);
    }
  }, []);

  useEffect(() => {
    const saved = readSavedChats();
    setHistory(saved);
    try {
      const activeId = window.localStorage.getItem(ACTIVE_CHAT_STORAGE_KEY);
      if (activeId) {
        void loadConversationById(activeId);
      }
    } catch {
      // ignore
    }
  }, [loadConversationById]);

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
          if (data.conversationId) {
            if (convIdRef.current !== data.conversationId) {
              convIdRef.current = data.conversationId;
              setConversationId(data.conversationId);
              try {
                window.localStorage.setItem(
                  ACTIVE_CHAT_STORAGE_KEY,
                  data.conversationId
                );
              } catch {
                // ignore
              }
            }
            upsertHistoryEntry(data.conversationId, text);
            await syncConversation(data.conversationId);
          }
        } catch (err) {
          setErrorMsg(err instanceof Error ? err.message : "Erro de rede.");
          setIsTyping(false);
        }
      });
    },
    [input, syncConversation, upsertHistoryEntry]
  );

  const startNewConversation = () => {
    convIdRef.current = null;
    seenOutboxIdsRef.current = new Set();
    setConversationId(null);
    setItems([]);
    setIsTyping(false);
    setErrorMsg(null);
    setDrawerOpen(false);
    try {
      window.localStorage.removeItem(ACTIVE_CHAT_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const deleteHistoryEntry = (id: string) => {
    setHistory((prev) => {
      const next = prev.filter((c) => c.id !== id);
      writeSavedChats(next);
      return next;
    });
    if (convIdRef.current === id) {
      startNewConversation();
    }
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
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Abrir histórico de conversas"
              title="Conversas anteriores"
              className="lume-btn-ghost lume-icon-btn"
            >
              <PanelLeft size={16} />
            </button>

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
            <Link
              href="/lancamentos"
              className="lume-btn-ghost"
              style={{ textDecoration: "none" }}
            >
              <ClipboardList size={15} />
              <span>Lançamentos</span>
            </Link>

            <Link
              href="/mapa-3d"
              className="lume-btn-ghost"
              style={{ textDecoration: "none" }}
            >
              <Box size={15} />
              <span>Mapa 3D</span>
            </Link>

            <button
              type="button"
              onClick={startNewConversation}
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
          </div>
        </div>
      </header>

      {/* History Drawer */}
      {drawerOpen && (
        <div
          className="lume-drawer-backdrop"
          onClick={() => setDrawerOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Histórico de conversas"
        >
          <aside
            className="lume-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              <span
                className="font-display"
                style={{ fontWeight: 700, fontSize: "15px" }}
              >
                Conversas
              </span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Fechar histórico"
                className="lume-btn-ghost lume-icon-btn"
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>
              <button
                type="button"
                onClick={startNewConversation}
                className="lume-btn-ghost"
                style={{ width: "100%", justifyContent: "center" }}
              >
                <Plus size={15} />
                <span>Nova conversa</span>
              </button>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "10px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              {history.length === 0 ? (
                <p
                  style={{
                    margin: "24px 12px",
                    fontSize: "13.5px",
                    color: "var(--muted)",
                    textAlign: "center",
                    lineHeight: 1.5,
                  }}
                >
                  Suas conversas recentes ficarão salvas aqui.
                </p>
              ) : (
                history.map((chat) => {
                  const active = chat.id === conversationId;
                  return (
                    <div
                      key={chat.id}
                      className={`lume-history-item${
                        active ? " lume-history-item-active" : ""
                      }`}
                    >
                      <button
                        type="button"
                        className="lume-history-select"
                        onClick={() => {
                          setDrawerOpen(false);
                          void loadConversationById(chat.id);
                        }}
                      >
                        <span className="lume-history-title">{chat.title}</span>
                        <span className="lume-history-meta">
                          {formatChatDate(chat.updatedAt)}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteHistoryEntry(chat.id)}
                        aria-label="Remover conversa da lista"
                        title="Remover da lista"
                        className="lume-history-del"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        </div>
      )}

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
        {loadingChat && items.length === 0 && (
          <div style={{ padding: "32px 0", textAlign: "center", color: "var(--muted)", fontSize: "14px" }}>
            Carregando conversa...
          </div>
        )}

        {!loadingChat && items.length === 0 && (
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
