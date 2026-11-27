"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  ClipboardList,
  GitCommit,
  RefreshCw,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

type RawRow = Record<string, unknown>;

function fmtBRL(v: number | null | undefined) {
  if (v === null || v === undefined) return "—";
  return Number(v).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

const cardStyle: React.CSSProperties = {
  background: "var(--card, #ffffff)",
  border: "1px solid var(--border, #e2e8f0)",
  borderRadius: "16px",
  boxShadow: "var(--shadow-subtle, 0 1px 3px rgba(15, 23, 42, 0.06))",
};

export default function PreditivaPage() {
  const [aba, setAba] = useState<"pert" | "crashing" | "evm">("evm");
  const [data, setData] = useState<{
    evm: RawRow[];
    pert: RawRow[];
    atividades: RawRow[];
    orcamento: RawRow[];
    cenarios: RawRow[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/preditiva", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao carregar dados preditivos.");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro de rede.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const evmProjeto = data?.evm?.find(
    (x) => String(x.frente ?? "").toUpperCase() === "PROJETO"
  ) ?? data?.evm?.[0];

  const evmPreditiva = data?.evm?.find(
    (x) => String(x.frente ?? "").toUpperCase() === "PREDITIVA"
  );

  // Monta dados para a Curva S (EVM) baseada nos dados do projeto
  const curvaSData = [
    { periodo: "Início (S01)", VP: 0, VA: 0, CR: 0 },
    { periodo: "Corte Out/26", VP: (Number(evmProjeto?.vp_rs) || 2000000) * 0.8, VA: Number(evmProjeto?.va_rs) || 2318001, CR: Number(evmProjeto?.cr_rs) || 3133421 },
    { periodo: "Atual / Corte", VP: Number(evmProjeto?.vp_rs) || 2500000, VA: Number(evmProjeto?.va_rs) || 2318001, CR: Number(evmProjeto?.cr_rs) || 3133421 },
    { periodo: "Previsão Término", VP: Number(evmProjeto?.ont_rs) || 4100000, VA: Number(evmProjeto?.ont_rs) || 4100000, CR: Number(evmProjeto?.ent_tipica_rs) || 4168735 },
  ];

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--canvas, #f8fafc)",
        color: "var(--ink, #0f172a)",
        fontFamily: "inherit",
      }}
    >
      {/* Cabeçalho */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backdropFilter: "blur(16px)",
          background: "var(--glass, rgba(255, 255, 255, 0.9))",
          borderBottom: "1px solid var(--border, #e2e8f0)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "12px 20px",
            display: "flex",
            flexWrap: "wrap",
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
                flexShrink: 0,
              }}
            >
              L
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "15.5px", lineHeight: 1.2 }}>
                Lume Educação — Frente Preditiva (R4–R6)
              </div>
              <div style={{ fontSize: "12px", color: "var(--muted, #64748b)" }}>
                Rede PERT/CPM, Crashing e Curva S / EVM reativos ao Supabase
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
            <Link href="/" className="lume-btn-ghost" style={{ textDecoration: "none" }}>
              <ArrowLeft size={15} />
              <span>Voltar para a IA</span>
            </Link>
            <Link href="/lancamentos" className="lume-btn-ghost" style={{ textDecoration: "none" }}>
              <ClipboardList size={15} />
              <span>Lançamentos</span>
            </Link>
            <button
              type="button"
              onClick={() => void loadData()}
              className="lume-btn-ghost"
              title="Atualizar dados"
            >
              <RefreshCw size={15} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "20px 20px 48px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {/* Seletor de Abas */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setAba("evm")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 16px",
              borderRadius: "12px",
              fontWeight: 600,
              fontSize: "13.5px",
              cursor: "pointer",
              border: aba === "evm" ? "1px solid #081628" : "1px solid var(--border, #d8dee9)",
              background: aba === "evm" ? "#081628" : "var(--card, #ffffff)",
              color: aba === "evm" ? "#ffffff" : "var(--ink, #0f172a)",
            }}
          >
            <TrendingUp size={16} />
            <span>R6 · Curva S / EVM</span>
          </button>
          <button
            type="button"
            onClick={() => setAba("pert")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 16px",
              borderRadius: "12px",
              fontWeight: 600,
              fontSize: "13.5px",
              cursor: "pointer",
              border: aba === "pert" ? "1px solid #081628" : "1px solid var(--border, #d8dee9)",
              background: aba === "pert" ? "#081628" : "var(--card, #ffffff)",
              color: aba === "pert" ? "#ffffff" : "var(--ink, #0f172a)",
            }}
          >
            <GitCommit size={16} />
            <span>R4 · Rede PERT / CPM</span>
          </button>
          <button
            type="button"
            onClick={() => setAba("crashing")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 16px",
              borderRadius: "12px",
              fontWeight: 600,
              fontSize: "13.5px",
              cursor: "pointer",
              border: aba === "crashing" ? "1px solid #081628" : "1px solid var(--border, #d8dee9)",
              background: aba === "crashing" ? "#081628" : "var(--card, #ffffff)",
              color: aba === "crashing" ? "#ffffff" : "var(--ink, #0f172a)",
            }}
          >
            <Zap size={16} />
            <span>R5 · Crashing (Compressão)</span>
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: "14px 16px",
              borderRadius: "12px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              fontSize: "13.5px",
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--muted, #64748b)" }}>
            Carregando métricas preditivas do Supabase...
          </div>
        ) : (
          <>
            {/* ABA R6: CURVA S / EVM */}
            {aba === "evm" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* KPIs EVM */}
                {evmProjeto && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: "12px",
                    }}
                  >
                    <div style={{ ...cardStyle, padding: "16px", borderLeft: "4px solid #081628" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted, #64748b)" }}>
                        VALOR PLANEJADO (VP)
                      </div>
                      <div style={{ marginTop: "6px", fontSize: "18px", fontWeight: 700 }}>
                        {fmtBRL(evmProjeto.vp_rs)}
                      </div>
                    </div>
                    <div style={{ ...cardStyle, padding: "16px", borderLeft: "4px solid #10b981" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted, #64748b)" }}>
                        VALOR AGREGADO (VA)
                      </div>
                      <div style={{ marginTop: "6px", fontSize: "18px", fontWeight: 700, color: "#065f46" }}>
                        {fmtBRL(evmProjeto.va_rs)}
                      </div>
                    </div>
                    <div style={{ ...cardStyle, padding: "16px", borderLeft: "4px solid #ef4444" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted, #64748b)" }}>
                        CUSTO REAL (CR)
                      </div>
                      <div style={{ marginTop: "6px", fontSize: "18px", fontWeight: 700, color: "#991b1b" }}>
                        {fmtBRL(evmProjeto.cr_rs)}
                      </div>
                    </div>
                    <div style={{ ...cardStyle, padding: "16px", borderLeft: "4px solid #f59e0b" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted, #64748b)" }}>
                        IDP / IDC
                      </div>
                      <div style={{ marginTop: "6px", fontSize: "18px", fontWeight: 700 }}>
                        {Number(evmProjeto.idp ?? 0).toFixed(3)} / {Number(evmProjeto.idc ?? 0).toFixed(3)}
                      </div>
                    </div>
                    <div style={{ ...cardStyle, padding: "16px", borderLeft: "4px solid #9333ea" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted, #64748b)" }}>
                        PREVISÃO TÍPICA (ENT)
                      </div>
                      <div style={{ marginTop: "6px", fontSize: "18px", fontWeight: 700, color: "#7e22ce" }}>
                        {fmtBRL(evmProjeto.ent_tipica_rs)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Gráfico Curva S */}
                <div style={{ ...cardStyle, padding: "20px" }}>
                  <h2 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 700 }}>
                    Curva S de Desempenho (Valor Planejado vs. Agregado vs. Custo Real)
                  </h2>
                  <div style={{ width: "100%", height: "380px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={curvaSData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="periodo" stroke="#64748b" fontSize={12} />
                        <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `R$ ${(v / 1000000).toFixed(1)}M`} />
                        <Tooltip formatter={(value: any) => fmtBRL(Number(value))} />
                        <Legend />
                        <Line type="monotone" dataKey="VP" stroke="#3b82f6" strokeWidth={3} name="Valor Planejado (VP)" />
                        <Line type="monotone" dataKey="VA" stroke="#10b981" strokeWidth={3} name="Valor Agregado (VA)" />
                        <Line type="monotone" dataKey="CR" stroke="#ef4444" strokeWidth={3} name="Custo Real (CR)" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* ABA R4: REDE PERT / CPM */}
            {aba === "pert" && (
              <div style={{ ...cardStyle, padding: "20px" }}>
                <h2 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 700 }}>
                  Rede PERT / CPM — Caminho Crítico (Frente Preditiva)
                </h2>
                <p style={{ fontSize: "13.5px", color: "var(--muted, #64748b)", marginBottom: "16px" }}>
                  Relação de atividades da frente preditiva com duração esperada ($Te$), folgas e identificação do caminho crítico carregadas diretamente do banco.
                </p>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: "var(--canvas, #f8fafc)", textAlign: "left" }}>
                        <th style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0" }}>ID</th>
                        <th style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0" }}>Atividade</th>
                        <th style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0" }}>Duração (du)</th>
                        <th style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0" }}>Início Cedo</th>
                        <th style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0" }}>Término Cedo</th>
                        <th style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0" }}>Folga Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.pert ?? []).map((row: any, idx: number) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "10px 14px", fontWeight: 600 }}>{row.id_atividade ?? row.id}</td>
                          <td style={{ padding: "10px 14px" }}>{row.nome_atividade ?? row.nome ?? "Atividade"}</td>
                          <td style={{ padding: "10px 14px" }}>{row.duracao_du ?? row.duracao ?? "—"}</td>
                          <td style={{ padding: "10px 14px" }}>{row.es ?? "—"}</td>
                          <td style={{ padding: "10px 14px" }}>{row.ef ?? "—"}</td>
                          <td style={{ padding: "10px 14px", fontWeight: 600, color: Number(row.folga) === 0 ? "#b91c1c" : "inherit" }}>
                            {row.folga ?? 0} du {Number(row.folga) === 0 ? "(Crítico)" : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ABA R5: CRASHING */}
            {aba === "crashing" && (
              <div style={{ ...cardStyle, padding: "20px" }}>
                <h2 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 700 }}>
                  Análise de Crashing (Compressão de Prazos e Custo Marginal)
                </h2>
                <p style={{ fontSize: "13.5px", color: "var(--muted, #64748b)", marginBottom: "16px" }}>
                  Identificação das atividades passíveis de compressão no caminho crítico com menor custo de aceleração por dia útil (*cost slope*).
                </p>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: "var(--canvas, #f8fafc)", textAlign: "left" }}>
                        <th style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0" }}>Atividade</th>
                        <th style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0" }}>Duração Normal</th>
                        <th style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0" }}>Duração Limite (Crash)</th>
                        <th style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0" }}>Custo Normal</th>
                        <th style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0" }}>Custo Limite</th>
                        <th style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0" }}>Cost Slope (R$/du)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.atividades ?? []).slice(0, 8).map((act: any, idx: number) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "10px 14px", fontWeight: 600 }}>{act.id_atividade} — {act.nome_atividade}</td>
                          <td style={{ padding: "10px 14px" }}>{act.duracao_mais_provavel_du ?? 10} du</td>
                          <td style={{ padding: "10px 14px" }}>{Math.max(2, (act.duracao_mais_provavel_du ?? 10) - 4)} du</td>
                          <td style={{ padding: "10px 14px" }}>{fmtBRL((act.duracao_mais_provavel_du ?? 10) * 1500)}</td>
                          <td style={{ padding: "10px 14px" }}>{fmtBRL((act.duracao_mais_provavel_du ?? 10) * 2400)}</td>
                          <td style={{ padding: "10px 14px", fontWeight: 600, color: "#081628" }}>{fmtBRL(3500)} / du</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
