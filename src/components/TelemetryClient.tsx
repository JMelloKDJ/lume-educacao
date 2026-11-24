"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";

interface TelemetryResponse {
  liveStatus: {
    dataStatus: string;
    controlesOk: number;
    controlesTotal: number;
  };
  summary: {
    total_turnos: number;
    turnos_ok: number;
    turnos_erro: number;
    escalamentos_flash: number;
    cache_hits_total: number;
    media_total_ms: number;
    p95_total_ms: number;
    tokens_in_total: number;
    tokens_out_total: number;
  } | null;
  turns: Array<{
    id: string;
    status: string;
    messages_coalesced: number;
    model_primary: string;
    escalated_to_flash: boolean;
    escalation_reason: string | null;
    cache_hits: number;
    rag_chunks_count: number;
    tools_called: Array<{ name: string; cacheHit: boolean; ms: number }>;
    actions_created: number;
    outbox_bubbles_count: number;
    debounce_ms: number;
    rag_ms: number;
    tools_ms: number;
    llm_ms: number;
    total_ms: number;
    tokens_in: number;
    tokens_out: number;
    error_message: string | null;
    created_at: string;
  }>;
  actions: Array<{
    id: string;
    action_type: string;
    governance_level: string;
    status: string;
    payload: Record<string, unknown>;
    created_at: string;
  }>;
  ragDocs: Array<{ source_file: string; chunks: number }>;
}

export function TelemetryClient() {
  const [data, setData] = useState<TelemetryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/telemetry");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Erro ao carregar telemetria");
      } else {
        setData(json);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro de rede");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const totalChunks =
    data?.ragDocs.reduce((acc, d) => acc + Number(d.chunks), 0) ?? 0;

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--canvas)",
        color: "var(--ink)",
        padding: "24px 16px 48px 16px",
      }}
    >
      <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link href="/" className="lume-btn-ghost">
              <ArrowLeft size={15} />
              Voltar ao Chat
            </Link>
            <h1 className="font-display" style={{ margin: 0, fontSize: "20px" }}>
              Telemetria e Governança
            </h1>
          </div>

          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="lume-btn-ghost"
            style={{
              background: "var(--accent)",
              color: "var(--accent-ink)",
              borderColor: "var(--accent)",
              fontWeight: 600,
            }}
          >
            <RefreshCw size={14} />
            Atualizar
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: "14px 16px",
              borderRadius: "12px",
              background: "var(--danger-bg)",
              color: "var(--danger-ink)",
              border: "1px solid var(--border)",
              marginBottom: "18px",
            }}
          >
            {error}
          </div>
        )}

        {data?.summary && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
              gap: "12px",
              marginBottom: "24px",
            }}
          >
            {[
              {
                label: "Turnos executados",
                value: `${data.summary.turnos_ok}/${data.summary.total_turnos}`,
                sub: `${data.summary.turnos_erro} erros`,
              },
              {
                label: "Escalonamentos Flash",
                value: String(data.summary.escalamentos_flash),
                sub: "autônomos 3.8-flash",
              },
              {
                label: "Latência Média / P95",
                value: `${data.summary.media_total_ms} ms`,
                sub: `P95: ${data.summary.p95_total_ms} ms`,
              },
              {
                label: "Cache Hits (DB)",
                value: String(data.summary.cache_hits_total),
                sub: `corte ${data.liveStatus.dataStatus}`,
              },
              {
                label: "Tokens In / Out",
                value: `${data.summary.tokens_in_total}`,
                sub: `out: ${data.summary.tokens_out_total}`,
              },
              {
                label: "Base RAG (pgvector)",
                value: `${totalChunks} chunks`,
                sub: `${data.ragDocs.length} arquivos`,
              },
            ].map((card) => (
              <div
                key={card.label}
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-card)",
                  padding: "16px",
                  boxShadow: "var(--shadow-subtle)",
                }}
              >
                <div style={{ fontSize: "12px", color: "var(--muted)" }}>{card.label}</div>
                <div
                  className="font-display"
                  style={{ fontSize: "22px", fontWeight: 700, margin: "4px 0" }}
                >
                  {card.value}
                </div>
                <div className="font-mono" style={{ fontSize: "11.5px", color: "var(--muted)" }}>
                  {card.sub}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Turn telemetry table */}
        <section
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-card)",
            padding: "20px",
            boxShadow: "var(--shadow-subtle)",
            marginBottom: "24px",
            overflowX: "auto",
          }}
        >
          <h2 className="font-display" style={{ margin: "0 0 14px 0", fontSize: "16px" }}>
            Últimos turnos
          </h2>
          {!data || data.turns.length === 0 ? (
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "13.5px" }}>
              Nenhum turno registrado ainda. Envie mensagens no chat para gerar telemetria.
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "8px" }}>Status</th>
                  <th style={{ padding: "8px" }}>Modelo</th>
                  <th style={{ padding: "8px" }}>Msgs / Bolhas</th>
                  <th style={{ padding: "8px" }}>Tools / Cache / RAG</th>
                  <th style={{ padding: "8px" }}>Tempos (Deb / Tools / LLM / Total)</th>
                  <th style={{ padding: "8px" }}>Tokens (In/Out)</th>
                </tr>
              </thead>
              <tbody>
                {data.turns.map((t) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px" }}>
                      <span
                        className="font-mono"
                        style={{
                          padding: "2px 8px",
                          borderRadius: "999px",
                          background:
                            t.status === "completed" ? "var(--success-bg)" : "var(--danger-bg)",
                          color: t.status === "completed" ? "var(--success-ink)" : "var(--danger-ink)",
                        }}
                      >
                        {t.status}
                      </span>
                      {t.error_message && (
                        <div style={{ color: "var(--danger-ink)", marginTop: "4px" }}>
                          {t.error_message}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "8px" }}>
                      <div>
                        <code>
                          {t.escalated_to_flash ? "gemini-3.8-flash" : t.model_primary}
                        </code>
                      </div>
                      {t.escalation_reason && (
                        <div style={{ color: "var(--muted)", fontSize: "11px" }}>
                          {t.escalation_reason}
                        </div>
                      )}
                    </td>
                    <td className="font-mono" style={{ padding: "8px" }}>
                      {t.messages_coalesced} in → {t.outbox_bubbles_count} out
                    </td>
                    <td style={{ padding: "8px" }}>
                      <div>
                        {t.tools_called.map((tc) => tc.name).join(", ") || "—"}
                      </div>
                      <div className="font-mono" style={{ fontSize: "11px", color: "var(--muted)" }}>
                        cache:{t.cache_hits} · rag:{t.rag_chunks_count} · acoes:{t.actions_created}
                      </div>
                    </td>
                    <td className="font-mono" style={{ padding: "8px" }}>
                      {t.debounce_ms} / {t.tools_ms + t.rag_ms} / {t.llm_ms} /{" "}
                      <strong>{t.total_ms}ms</strong>
                    </td>
                    <td className="font-mono" style={{ padding: "8px" }}>
                      {t.tokens_in} / {t.tokens_out}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Actions table */}
        <section
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-card)",
            padding: "20px",
            boxShadow: "var(--shadow-subtle)",
            overflowX: "auto",
          }}
        >
          <h2 className="font-display" style={{ margin: "0 0 14px 0", fontSize: "16px" }}>
            Ações registradas
          </h2>
          {!data || data.actions.length === 0 ? (
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "13.5px" }}>
              Nenhuma ação de governança registrada ainda.
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "8px" }}>Tipo</th>
                  <th style={{ padding: "8px" }}>Alçada</th>
                  <th style={{ padding: "8px" }}>Título</th>
                  <th style={{ padding: "8px" }}>Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {data.actions.map((a) => (
                  <tr key={a.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="font-mono" style={{ padding: "8px" }}>
                      {a.action_type}
                    </td>
                    <td className="font-mono" style={{ padding: "8px" }}>
                      {a.governance_level}
                    </td>
                    <td style={{ padding: "8px", fontWeight: 600 }}>
                      {String(a.payload?.titulo ?? "—")}
                    </td>
                    <td style={{ padding: "8px", color: "var(--muted)" }}>
                      {String(a.payload?.descricao ?? "")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
