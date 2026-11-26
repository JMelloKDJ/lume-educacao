"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Pencil,
  RefreshCw,
  Trash2,
  Zap,
} from "lucide-react";
import {
  BOLETINS_CONFIG,
  BoletimDef,
  validateBoletimPayload,
} from "@/lib/boletins-config";

type ControleRow = {
  ordem: number;
  codigo: string;
  metrica: string;
  ate_2026_11_13: number;
  meta_2026_11_13: number;
  atual_dinamico: number;
  status_13_11: string;
};

type EvmRow = {
  frente: string;
  data_corte: string;
  va_rs: number | null;
  cr_rs: number | null;
  idp: number | null;
  idc: number | null;
  ent_tipica_rs: number | null;
};

function buildDefaults(boletim: BoletimDef): Record<string, string> {
  const init: Record<string, string> = {};
  for (const f of boletim.fields) {
    init[f.name] =
      f.defaultValue !== undefined
        ? String(f.defaultValue)
        : f.type === "select" && f.options?.length
          ? f.options[0]
          : "";
  }
  return init;
}

function fmtBRL(v: number | null | undefined) {
  if (v === null || v === undefined) return "—";
  return Number(v).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "9px 12px",
  borderRadius: "10px",
  border: "1px solid var(--border, #d8dee9)",
  background: "var(--canvas, #f8fafc)",
  color: "var(--ink, #0f172a)",
  fontSize: "13.5px",
  outline: "none",
};

const cardStyle: React.CSSProperties = {
  background: "var(--card, #ffffff)",
  border: "1px solid var(--border, #e2e8f0)",
  borderRadius: "16px",
  boxShadow: "var(--shadow-subtle, 0 1px 3px rgba(15, 23, 42, 0.06))",
};

export default function LancamentosPage() {
  const [modo, setModo] = useState<"quinzena" | "surpresa">("quinzena");
  const [mostrarControles, setMostrarControles] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(BOLETINS_CONFIG[0].id);
  const boletim = useMemo(
    () => BOLETINS_CONFIG.find((b) => b.id === selectedId) ?? BOLETINS_CONFIG[0],
    [selectedId]
  );

  const [formData, setFormData] = useState<Record<string, string>>(() =>
    buildDefaults(BOLETINS_CONFIG[0])
  );
  const [editingKeys, setEditingKeys] = useState<Record<string, unknown> | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [controles, setControles] = useState<ControleRow[]>([]);
  const [evmProjeto, setEvmProjeto] = useState<EvmRow | null>(null);

  const [surpresaAtrasoOn, setSurpresaAtrasoOn] = useState(true);
  const [surpresaMudancaOn, setSurpresaMudancaOn] = useState(true);
  const [surpresaCartaoOn, setSurpresaCartaoOn] = useState(true);

  const [surpresaAtraso, setSurpresaAtraso] = useState<Record<string, string>>({
    id_ocorrencia: "OC-SURP-01",
    data: "2026-11-26",
    id_risco: "R05",
    descricao: "Atraso comunicado ao vivo no Boletim Surpresa",
    frente: "PREDITIVA",
    id_atividade: "A19",
    impacto_custo_real_rs: "0",
    impacto_prazo_real_du: "5",
    custo_ja_incluido_em_pagamentos: "NAO",
  });

  const [surpresaMudanca, setSurpresaMudanca] = useState<Record<string, string>>({
    id_mudanca: "SM-SURP-01",
    data_abertura: "2026-11-26",
    id_solicitante: "PI01",
    descricao: "Mudança aprovada ao vivo pelo Comitê",
    tipo_mudanca: "ESCOPO",
    frente: "AGIL",
    id_atividade: "",
    impacto_custo_rs: "15000",
    impacto_prazo_du: "0",
    impacto_pontos: "8",
    status: "APROVADA",
    data_decisao: "2026-11-26",
    nivel_decisor: "COMITE",
    implementada: "NAO",
  });

  const [surpresaCartao, setSurpresaCartao] = useState<Record<string, string>>({
    id_transicao: "TR-SURP-01",
    id_item: "LU-156",
    data: "2026-11-26",
    status_origem: "EM_TESTE",
    status_destino: "CONCLUIDO",
    id_pessoa: "P17",
  });

  const fetchRows = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/boletins?boletimId=${encodeURIComponent(id)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao carregar registros.");
      setRows(json.data ?? []);
    } catch (e) {
      setFeedback({ type: "err", text: e instanceof Error ? e.message : "Erro ao listar." });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchResumo = useCallback(async () => {
    try {
      const res = await fetch("/api/boletins?mode=resumo");
      const json = await res.json();
      if (res.ok) {
        setControles(json.controles ?? []);
        const proj = (json.evm ?? []).find((x: EvmRow) => x.frente === "PROJETO") ?? null;
        setEvmProjeto(proj);
      }
    } catch {
      // silencioso na carga inicial
    }
  }, []);

  useEffect(() => {
    setFormData(buildDefaults(boletim));
    setEditingKeys(null);
    setFeedback(null);
    fetchRows(boletim.id);
  }, [boletim, fetchRows]);

  useEffect(() => {
    fetchResumo();
  }, [fetchResumo]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    const check = validateBoletimPayload(boletim, formData);
    if (!check.valid) {
      setFeedback({ type: "err", text: check.errors.join(" ") });
      return;
    }

    setSaving(true);
    try {
      const method = editingKeys ? "PATCH" : "POST";
      const res = await fetch("/api/boletins", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boletimId: boletim.id,
          keys: editingKeys,
          data: formData,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao gravar no Supabase.");

      setFeedback({ type: "ok", text: json.message });
      setFormData(buildDefaults(boletim));
      setEditingKeys(null);
      await Promise.all([fetchRows(boletim.id), fetchResumo()]);
    } catch (err) {
      setFeedback({ type: "err", text: err instanceof Error ? err.message : "Erro ao salvar." });
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(row: Record<string, unknown>) {
    const keys: Record<string, unknown> = {};
    for (const pk of boletim.pkColumns) keys[pk] = row[pk];
    const populated: Record<string, string> = {};
    for (const f of boletim.fields) {
      const val = row[f.name];
      populated[f.name] = val === null || val === undefined ? "" : String(val);
    }
    setEditingKeys(keys);
    setFormData(populated);
    setFeedback({ type: "ok", text: `Editando registro selecionado de ${boletim.codigo}.` });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(row: Record<string, unknown>) {
    if (!window.confirm("Deseja realmente excluir este lançamento do banco de dados?")) return;
    const keys: Record<string, unknown> = {};
    for (const pk of boletim.pkColumns) keys[pk] = row[pk];

    setSaving(true);
    try {
      const res = await fetch("/api/boletins", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boletimId: boletim.id, keys }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao excluir.");
      setFeedback({ type: "ok", text: json.message });
      await Promise.all([fetchRows(boletim.id), fetchResumo()]);
    } catch (err) {
      setFeedback({ type: "err", text: err instanceof Error ? err.message : "Erro ao excluir." });
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitSurpresa(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setSaving(true);
    try {
      const res = await fetch("/api/boletins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "boletim_surpresa",
          atraso: { enabled: surpresaAtrasoOn, data: surpresaAtraso },
          mudanca: { enabled: surpresaMudancaOn, data: surpresaMudanca },
          cartao: { enabled: surpresaCartaoOn, data: surpresaCartao },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao gravar Boletim Surpresa.");
      setFeedback({
        type: "ok",
        text: `${json.message} ${Array.isArray(json.detalhes) ? json.detalhes.join(" | ") : ""}`,
      });
      await fetchResumo();
    } catch (err) {
      setFeedback({ type: "err", text: err instanceof Error ? err.message : "Erro ao lançar." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--canvas, #f8fafc)",
        color: "var(--ink, #0f172a)",
        fontFamily: "inherit",
      }}
    >
      {/* Header idêntico ao chat */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backdropFilter: "blur(16px)",
          background: "var(--glass, rgba(255, 255, 255, 0.88))",
          borderBottom: "1px solid var(--border, #e2e8f0)",
        }}
      >
        <div
          style={{
            maxWidth: "1080px",
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
              className="font-display"
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
              <div
                className="font-display"
                style={{ fontWeight: 700, fontSize: "15.5px", lineHeight: 1.2 }}
              >
                Lume Educação
              </div>
              <div style={{ fontSize: "12px", color: "var(--muted, #64748b)" }}>
                Central de Lançamentos &amp; Atualização ao Vivo
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
            <Link
              href="/"
              className="lume-btn-ghost"
              style={{ textDecoration: "none" }}
            >
              <ArrowLeft size={15} />
              <span>Voltar para a IA</span>
            </Link>

            <button
              type="button"
              onClick={() => setModo("quinzena")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "10px",
                fontSize: "13.5px",
                fontWeight: 600,
                cursor: "pointer",
                border: modo === "quinzena" ? "1px solid #081628" : "1px solid var(--border, #d8dee9)",
                background: modo === "quinzena" ? "#081628" : "var(--card, #ffffff)",
                color: modo === "quinzena" ? "#ffffff" : "var(--ink, #0f172a)",
              }}
            >
              <ClipboardList size={15} />
              <span>Quinzena (B1–B10)</span>
            </button>

            <button
              type="button"
              onClick={() => setModo("surpresa")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "10px",
                fontSize: "13.5px",
                fontWeight: 600,
                cursor: "pointer",
                border: modo === "surpresa" ? "1px solid #b91c1c" : "1px solid rgba(185, 28, 28, 0.3)",
                background: modo === "surpresa" ? "#b91c1c" : "rgba(185, 28, 28, 0.08)",
                color: modo === "surpresa" ? "#ffffff" : "#b91c1c",
              }}
            >
              <Zap size={15} />
              <span>Boletim Surpresa</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main
        style={{
          maxWidth: "1080px",
          margin: "0 auto",
          padding: "24px 20px 64px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {/* Painel de Indicadores EVM ao vivo */}
        {evmProjeto && (
          <section style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--muted, #64748b)",
                }}
              >
                Indicadores do Projeto em Tempo Real (Supabase)
              </span>
              {controles.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMostrarControles((v) => !v)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#081628",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  {mostrarControles
                    ? "Ocultar números de controle"
                    : `Ver conferência do banco (${controles.length} métricas OK)`}
                </button>
              )}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
                gap: "12px",
              }}
            >
              <div
                style={{
                  ...cardStyle,
                  padding: "14px 16px",
                  borderLeft: "4px solid #c9a227",
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted, #64748b)" }}>
                  DATA DE CORTE
                </div>
                <div style={{ marginTop: "6px", fontSize: "20px", fontWeight: 700 }}>
                  {evmProjeto.data_corte}
                </div>
              </div>

              <div style={{ ...cardStyle, padding: "14px 16px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted, #64748b)" }}>
                  VALOR AGREGADO (VA)
                </div>
                <div style={{ marginTop: "6px", fontSize: "20px", fontWeight: 700 }}>
                  {fmtBRL(evmProjeto.va_rs)}
                </div>
              </div>

              <div style={{ ...cardStyle, padding: "14px 16px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted, #64748b)" }}>
                  CUSTO REAL (CR)
                </div>
                <div style={{ marginTop: "6px", fontSize: "20px", fontWeight: 700 }}>
                  {fmtBRL(evmProjeto.cr_rs)}
                </div>
              </div>

              <div style={{ ...cardStyle, padding: "14px 16px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted, #64748b)" }}>
                  DESEMPENHO (IDP / IDC)
                </div>
                <div style={{ marginTop: "6px", fontSize: "20px", fontWeight: 700, color: "#081628" }}>
                  {evmProjeto.idp?.toFixed(3)} / {evmProjeto.idc?.toFixed(3)}
                </div>
              </div>

              <div style={{ ...cardStyle, padding: "14px 16px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted, #64748b)" }}>
                  PREVISÃO FINAL (ENT)
                </div>
                <div style={{ marginTop: "6px", fontSize: "20px", fontWeight: 700, color: "#b91c1c" }}>
                  {fmtBRL(evmProjeto.ent_tipica_rs)}
                </div>
              </div>
            </div>

            {mostrarControles && controles.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "10px",
                  marginTop: "4px",
                }}
              >
                {controles.map((c) => (
                  <div key={c.codigo} style={{ ...cardStyle, padding: "10px 14px" }}>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--muted, #64748b)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={c.metrica}
                    >
                      {c.metrica}
                    </div>
                    <div
                      style={{
                        marginTop: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                      }}
                    >
                      <strong style={{ fontSize: "15px" }}>
                        {Number(c.atual_dinamico).toLocaleString("pt-BR")}
                      </strong>
                      <span
                        style={{
                          padding: "2px 7px",
                          borderRadius: "999px",
                          fontSize: "10.5px",
                          fontWeight: 700,
                          background: c.status_13_11 === "OK" ? "#dcfce7" : "#fef3c7",
                          color: c.status_13_11 === "OK" ? "#166534" : "#92400e",
                        }}
                      >
                        {c.status_13_11}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Alerta de feedback */}
        {feedback && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 16px",
              borderRadius: "12px",
              fontSize: "13.5px",
              fontWeight: 500,
              background: feedback.type === "ok" ? "#ecfdf5" : "#fef2f2",
              border: feedback.type === "ok" ? "1px solid #a7f3d0" : "1px solid #fecaca",
              color: feedback.type === "ok" ? "#065f46" : "#991b1b",
            }}
          >
            {feedback.type === "ok" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* MODO BOLETIM SURPRESA */}
        {modo === "surpresa" ? (
          <form onSubmit={handleSubmitSurpresa} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div style={{ ...cardStyle, padding: "18px 20px" }}>
              <h1 style={{ margin: 0, fontSize: "19px", fontWeight: 700 }}>
                Boletim Surpresa — Lançamento Rápido ao Vivo
              </h1>
              <p style={{ margin: "6px 0 0", fontSize: "13.5px", color: "var(--muted, #64748b)" }}>
                Marque apenas os eventos anunciados na hora, preencha os campos e clique no botão vermelho para gravar no Supabase e recalcular os números para a IA.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
                gap: "16px",
              }}
            >
              {/* Bloco 1 */}
              <div style={{ ...cardStyle, padding: "18px", borderTop: "4px solid #b91c1c" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontWeight: 700,
                    fontSize: "14.5px",
                    color: "#b91c1c",
                    marginBottom: "14px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={surpresaAtrasoOn}
                    onChange={(e) => setSurpresaAtrasoOn(e.target.checked)}
                  />
                  1. Atraso / Ocorrência de Risco
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <input
                    style={inputStyle}
                    placeholder="ID Ocorrência (ex: OC-SURP-01)"
                    value={surpresaAtraso.id_ocorrencia}
                    onChange={(e) => setSurpresaAtraso({ ...surpresaAtraso, id_ocorrencia: e.target.value })}
                  />
                  <input
                    style={inputStyle}
                    type="date"
                    value={surpresaAtraso.data}
                    onChange={(e) => setSurpresaAtraso({ ...surpresaAtraso, data: e.target.value })}
                  />
                  <input
                    style={inputStyle}
                    placeholder="Atividade impactada (ex: A19, A32)"
                    value={surpresaAtraso.id_atividade}
                    onChange={(e) => setSurpresaAtraso({ ...surpresaAtraso, id_atividade: e.target.value })}
                  />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <input
                      style={inputStyle}
                      type="number"
                      placeholder="Prazo (du)"
                      value={surpresaAtraso.impacto_prazo_real_du}
                      onChange={(e) => setSurpresaAtraso({ ...surpresaAtraso, impacto_prazo_real_du: e.target.value })}
                    />
                    <input
                      style={inputStyle}
                      type="number"
                      placeholder="Custo (R$)"
                      value={surpresaAtraso.impacto_custo_real_rs}
                      onChange={(e) => setSurpresaAtraso({ ...surpresaAtraso, impacto_custo_real_rs: e.target.value })}
                    />
                  </div>
                  <input
                    style={inputStyle}
                    placeholder="Descrição do atraso"
                    value={surpresaAtraso.descricao}
                    onChange={(e) => setSurpresaAtraso({ ...surpresaAtraso, descricao: e.target.value })}
                  />
                </div>
              </div>

              {/* Bloco 2 */}
              <div style={{ ...cardStyle, padding: "18px", borderTop: "4px solid #c9a227" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontWeight: 700,
                    fontSize: "14.5px",
                    color: "#92400e",
                    marginBottom: "14px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={surpresaMudancaOn}
                    onChange={(e) => setSurpresaMudancaOn(e.target.checked)}
                  />
                  2. Mudança Aprovada (SM)
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <input
                    style={inputStyle}
                    placeholder="ID Mudança (ex: SM-SURP-01)"
                    value={surpresaMudanca.id_mudanca}
                    onChange={(e) => setSurpresaMudanca({ ...surpresaMudanca, id_mudanca: e.target.value })}
                  />
                  <input
                    style={inputStyle}
                    type="date"
                    value={surpresaMudanca.data_abertura}
                    onChange={(e) =>
                      setSurpresaMudanca({
                        ...surpresaMudanca,
                        data_abertura: e.target.value,
                        data_decisao: e.target.value,
                      })
                    }
                  />
                  <input
                    style={inputStyle}
                    placeholder="Descrição da mudança"
                    value={surpresaMudanca.descricao}
                    onChange={(e) => setSurpresaMudanca({ ...surpresaMudanca, descricao: e.target.value })}
                  />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <input
                      style={inputStyle}
                      type="number"
                      placeholder="Custo (R$)"
                      value={surpresaMudanca.impacto_custo_rs}
                      onChange={(e) => setSurpresaMudanca({ ...surpresaMudanca, impacto_custo_rs: e.target.value })}
                    />
                    <input
                      style={inputStyle}
                      type="number"
                      placeholder="Pontos"
                      value={surpresaMudanca.impacto_pontos}
                      onChange={(e) => setSurpresaMudanca({ ...surpresaMudanca, impacto_pontos: e.target.value })}
                    />
                  </div>
                  <select
                    style={inputStyle}
                    value={surpresaMudanca.nivel_decisor}
                    onChange={(e) => setSurpresaMudanca({ ...surpresaMudanca, nivel_decisor: e.target.value })}
                  >
                    <option value="GERENTE">Alçada: GERENTE</option>
                    <option value="PATROCINADOR">Alçada: PATROCINADOR</option>
                    <option value="COMITE">Alçada: COMITE</option>
                  </select>
                </div>
              </div>

              {/* Bloco 3 */}
              <div style={{ ...cardStyle, padding: "18px", borderTop: "4px solid #047857" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontWeight: 700,
                    fontSize: "14.5px",
                    color: "#047857",
                    marginBottom: "14px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={surpresaCartaoOn}
                    onChange={(e) => setSurpresaCartaoOn(e.target.checked)}
                  />
                  3. Cartão Movido no Quadro
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <input
                    style={inputStyle}
                    placeholder="ID Transição (ex: TR-SURP-01)"
                    value={surpresaCartao.id_transicao}
                    onChange={(e) => setSurpresaCartao({ ...surpresaCartao, id_transicao: e.target.value })}
                  />
                  <input
                    style={inputStyle}
                    type="date"
                    value={surpresaCartao.data}
                    onChange={(e) => setSurpresaCartao({ ...surpresaCartao, data: e.target.value })}
                  />
                  <input
                    style={inputStyle}
                    placeholder="ID Item (ex: LU-156)"
                    value={surpresaCartao.id_item}
                    onChange={(e) => setSurpresaCartao({ ...surpresaCartao, id_item: e.target.value })}
                  />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <select
                      style={inputStyle}
                      value={surpresaCartao.status_origem}
                      onChange={(e) => setSurpresaCartao({ ...surpresaCartao, status_origem: e.target.value })}
                    >
                      <option value="A_FAZER">De: A_FAZER</option>
                      <option value="EM_ANDAMENTO">De: EM_ANDAMENTO</option>
                      <option value="EM_REVISAO">De: EM_REVISAO</option>
                      <option value="EM_TESTE">De: EM_TESTE</option>
                    </select>
                    <select
                      style={inputStyle}
                      value={surpresaCartao.status_destino}
                      onChange={(e) => setSurpresaCartao({ ...surpresaCartao, status_destino: e.target.value })}
                    >
                      <option value="EM_ANDAMENTO">Para: EM_ANDAMENTO</option>
                      <option value="EM_REVISAO">Para: EM_REVISAO</option>
                      <option value="EM_TESTE">Para: EM_TESTE</option>
                      <option value="CONCLUIDO">Para: CONCLUIDO</option>
                    </select>
                  </div>
                  <input
                    style={inputStyle}
                    placeholder="Quem moveu (ex: P17)"
                    value={surpresaCartao.id_pessoa}
                    onChange={(e) => setSurpresaCartao({ ...surpresaCartao, id_pessoa: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "13px 24px",
                borderRadius: "12px",
                border: "none",
                background: "#b91c1c",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.6 : 1,
              }}
            >
              <Zap size={17} />
              <span>
                {saving ? "Gravando no Supabase..." : "Lançar Boletim Surpresa e Recalcular Indicadores"}
              </span>
            </button>
          </form>
        ) : (
          /* MODO QUINZENA B1-B10 */
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Seletor de Boletim */}
            <div style={{ ...cardStyle, padding: "16px 20px" }}>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--muted, #64748b)",
                  marginBottom: "10px",
                }}
              >
                1. Escolha qual boletim deseja registrar ou consultar
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                {BOLETINS_CONFIG.map((b) => {
                  const active = b.id === boletim.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedId(b.id)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "999px",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        cursor: "pointer",
                        border: active ? "1px solid #081628" : "1px solid var(--border, #d8dee9)",
                        background: active ? "#081628" : "var(--canvas, #f8fafc)",
                        color: active ? "#ffffff" : "var(--ink, #0f172a)",
                      }}
                    >
                      {b.codigo} · {b.titulo.split(" ")[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Formulário do Boletim */}
            <form onSubmit={handleSubmit} style={{ ...cardStyle, padding: "22px 24px" }}>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "12px",
                  marginBottom: "18px",
                  paddingBottom: "14px",
                  borderBottom: "1px solid var(--border, #e2e8f0)",
                }}
              >
                <div>
                  <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
                    {boletim.codigo} — {boletim.titulo}
                  </h2>
                  <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--muted, #64748b)" }}>
                    {boletim.descricao}
                  </p>
                </div>
                {editingKeys && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingKeys(null);
                      setFormData(buildDefaults(boletim));
                    }}
                    className="lume-btn-ghost"
                  >
                    Cancelar edição
                  </button>
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "14px",
                }}
              >
                {boletim.fields.map((field) => (
                  <div key={field.name} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    <label style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--ink, #1e293b)" }}>
                      {field.label}
                      {field.required && <span style={{ color: "#b91c1c", marginLeft: "3px" }}>*</span>}
                    </label>
                    {field.type === "select" ? (
                      <select
                        style={inputStyle}
                        value={formData[field.name] ?? ""}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        required={field.required}
                      >
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt || "(vazio)"}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        style={inputStyle}
                        type={field.type}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        placeholder={field.placeholder}
                        value={formData[field.name] ?? ""}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        required={field.required}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "10px 22px",
                    borderRadius: "10px",
                    border: "1px solid rgba(201, 162, 39, 0.55)",
                    background: "#081628",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving
                    ? "Salvando..."
                    : editingKeys
                      ? `Salvar alteração em ${boletim.codigo}`
                      : `Gravar ${boletim.codigo} no banco`}
                </button>
              </div>
            </form>

            {/* Tabela de registros existentes */}
            <section style={{ ...cardStyle, overflow: "hidden" }}>
              <div
                style={{
                  padding: "14px 20px",
                  borderBottom: "1px solid var(--border, #e2e8f0)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <h3 style={{ margin: 0, fontSize: "14.5px", fontWeight: 700 }}>
                  Últimos registros em {boletim.codigo} ({rows.length})
                </h3>
                <button
                  type="button"
                  onClick={() => fetchRows(boletim.id)}
                  className="lume-btn-ghost"
                  style={{ fontSize: "12.5px", padding: "6px 10px" }}
                >
                  <RefreshCw size={13} />
                  <span>Atualizar</span>
                </button>
              </div>

              {loading ? (
                <p style={{ padding: "20px", margin: 0, fontSize: "13.5px", color: "var(--muted, #64748b)" }}>
                  Carregando registros do banco...
                </p>
              ) : rows.length === 0 ? (
                <p style={{ padding: "20px", margin: 0, fontSize: "13.5px", color: "var(--muted, #64748b)" }}>
                  Nenhum registro encontrado nesta tabela.
                </p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: "var(--canvas, #f8fafc)", textAlign: "left" }}>
                        {boletim.fields.slice(0, 6).map((f) => (
                          <th
                            key={f.name}
                            style={{
                              padding: "10px 14px",
                              fontWeight: 700,
                              fontSize: "12px",
                              color: "var(--muted, #475569)",
                              borderBottom: "1px solid var(--border, #e2e8f0)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {f.label}
                          </th>
                        ))}
                        <th
                          style={{
                            padding: "10px 14px",
                            textAlign: "right",
                            fontWeight: 700,
                            fontSize: "12px",
                            color: "var(--muted, #475569)",
                            borderBottom: "1px solid var(--border, #e2e8f0)",
                          }}
                        >
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid var(--border, #f1f5f9)" }}>
                          {boletim.fields.slice(0, 6).map((f) => (
                            <td key={f.name} style={{ padding: "10px 14px", color: "var(--ink, #0f172a)" }}>
                              {row[f.name] !== null && row[f.name] !== undefined
                                ? String(row[f.name])
                                : "—"}
                            </td>
                          ))}
                          <td style={{ padding: "10px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                            <button
                              type="button"
                              onClick={() => handleEdit(row)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                marginRight: "10px",
                                border: "none",
                                background: "transparent",
                                color: "#081628",
                                fontWeight: 600,
                                fontSize: "12.5px",
                                cursor: "pointer",
                              }}
                            >
                              <Pencil size={13} />
                              <span>Editar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(row)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                border: "none",
                                background: "transparent",
                                color: "#b91c1c",
                                fontWeight: 600,
                                fontSize: "12.5px",
                                cursor: "pointer",
                              }}
                            >
                              <Trash2 size={13} />
                              <span>Excluir</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
