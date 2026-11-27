"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Box,
  ClipboardList,
  GitCommit,
  RefreshCw,
  TrendingUp,
  Zap,
} from "lucide-react";

type RawRow = Record<string, unknown>;

interface ApiData {
  evm: RawRow[];
  pert: RawRow[];
  atividades: RawRow[];
  orcamento: RawRow[];
  cenarios: RawRow[];
}

interface PertItem {
  id: string;
  nome: string;
  duracao: number;
  es: number;
  ef: number;
  ls: number;
  lf: number;
  folga: number;
  critica: boolean;
}

interface CrashItem {
  id: string;
  nome: string;
  critica: boolean;
  duracaoNormal: number;
  duracaoCrash: number;
  maxReducao: number;
  custoNormal: number;
  custoCrash: number;
  slope: number;
}

interface CurvaSPoint {
  label: string;
  vp: number;
  va: number | null;
  cr: number | null;
  entProj: number | null;
}

function pickStr(row: RawRow, keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v !== null && v !== undefined && String(v).trim() !== "") {
      return String(v).trim();
    }
  }
  return "";
}

function pickNum(row: RawRow, keys: string[]): number | null {
  for (const k of keys) {
    const v = row[k];
    if (v !== null && v !== undefined && String(v).trim() !== "") {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

function pickBool(row: RawRow, keys: string[]): boolean | null {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v !== 0;
    if (typeof v === "string") {
      const up = v.trim().toUpperCase();
      if (
        up === "TRUE" ||
        up === "SIM" ||
        up === "S" ||
        up === "1" ||
        up === "CRITICA" ||
        up === "CRÍTICA"
      ) {
        return true;
      }
      if (up === "FALSE" || up === "NAO" || up === "NÃO" || up === "N" || up === "0") {
        return false;
      }
    }
  }
  return null;
}

function fmtBRL(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

function fmtNum(v: number | null | undefined, digits = 2): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  return v.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

const cardStyle: React.CSSProperties = {
  background: "var(--card, #ffffff)",
  border: "1px solid var(--border, #e2e8f0)",
  borderRadius: "16px",
  boxShadow: "var(--shadow-subtle, 0 1px 3px rgba(15, 23, 42, 0.06))",
};

function CurvaSChart({ points }: { points: CurvaSPoint[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const width = 780;
  const height = 310;
  const pad = { top: 24, right: 28, bottom: 44, left: 76 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const maxVal = useMemo(() => {
    let m = 100000;
    for (const p of points) {
      m = Math.max(m, p.vp, p.va ?? 0, p.cr ?? 0, p.entProj ?? 0);
    }
    return m * 1.12;
  }, [points]);

  const xAt = (i: number) =>
    pad.left + (points.length > 1 ? (i / (points.length - 1)) * plotW : plotW / 2);
  const yAt = (val: number) => pad.top + plotH - (val / maxVal) * plotH;

  const buildPath = (getter: (p: CurvaSPoint) => number | null) => {
    let d = "";
    points.forEach((p, i) => {
      const val = getter(p);
      if (val === null) return;
      d += `${d === "" ? "M" : "L"} ${xAt(i).toFixed(1)} ${yAt(val).toFixed(1)} `;
    });
    return d.trim();
  };

  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const activePoint =
    hoverIdx !== null ? points[hoverIdx] : points[points.length - 2] ?? null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "14px",
          fontSize: "12.5px",
          fontWeight: 600,
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{ width: 14, height: 3, background: "#2563eb", display: "inline-block" }}
          />
          Valor Planejado (VP)
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{ width: 14, height: 3, background: "#10b981", display: "inline-block" }}
          />
          Valor Agregado (VA)
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{ width: 14, height: 3, background: "#ef4444", display: "inline-block" }}
          />
          Custo Real (CR)
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              width: 14,
              height: 0,
              borderTop: "2.5px dashed #9333ea",
              display: "inline-block",
            }}
          />
          Projeção ENT (Típica)
        </span>
      </div>

      <div style={{ width: "100%", overflowX: "auto" }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: "100%", minWidth: "560px", height: "auto", display: "block" }}
          role="img"
          aria-label="Gráfico Curva S de EVM"
        >
          {ticks.map((t) => {
            const val = maxVal * t;
            const y = yAt(val);
            return (
              <g key={t}>
                <line
                  x1={pad.left}
                  x2={width - pad.right}
                  y1={y}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray={t === 0 ? undefined : "4 4"}
                />
                <text
                  x={pad.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#64748b"
                >
                  R$ {(val / 1000000).toFixed(1)}M
                </text>
              </g>
            );
          })}

          <path d={buildPath((p) => p.vp)} fill="none" stroke="#2563eb" strokeWidth={3} />
          <path d={buildPath((p) => p.va)} fill="none" stroke="#10b981" strokeWidth={3} />
          <path d={buildPath((p) => p.cr)} fill="none" stroke="#ef4444" strokeWidth={3} />
          <path
            d={buildPath((p) => p.entProj)}
            fill="none"
            stroke="#9333ea"
            strokeWidth={2.5}
            strokeDasharray="6 5"
          />

          {points.map((p, i) => {
            const x = xAt(i);
            const isHover = hoverIdx === i;
            return (
              <g
                key={p.label}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                onClick={() => setHoverIdx(i)}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x={x - plotW / Math.max(points.length * 2, 2)}
                  y={pad.top}
                  width={plotW / Math.max(points.length, 1)}
                  height={plotH}
                  fill="transparent"
                />
                {isHover && (
                  <line
                    x1={x}
                    x2={x}
                    y1={pad.top}
                    y2={height - pad.bottom}
                    stroke="#94a3b8"
                    strokeDasharray="3 3"
                  />
                )}
                <circle cx={x} cy={yAt(p.vp)} r={isHover ? 6 : 4} fill="#2563eb" />
                {p.va !== null && (
                  <circle cx={x} cy={yAt(p.va)} r={isHover ? 6 : 4} fill="#10b981" />
                )}
                {p.cr !== null && (
                  <circle cx={x} cy={yAt(p.cr)} r={isHover ? 6 : 4} fill="#ef4444" />
                )}
                {p.entProj !== null && (
                  <circle cx={x} cy={yAt(p.entProj)} r={isHover ? 6 : 4} fill="#9333ea" />
                )}
                <text
                  x={x}
                  y={height - 14}
                  textAnchor="middle"
                  fontSize="11.5"
                  fontWeight={isHover ? 700 : 500}
                  fill={isHover ? "#081628" : "#64748b"}
                >
                  {p.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {activePoint && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "10px",
            background: "var(--canvas, #f8fafc)",
            border: "1px solid var(--border, #e2e8f0)",
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            fontSize: "12.5px",
          }}
        >
          <strong>{activePoint.label}:</strong>
          <span style={{ color: "#1d4ed8" }}>VP: {fmtBRL(activePoint.vp)}</span>
          {activePoint.va !== null && (
            <span style={{ color: "#047857" }}>VA: {fmtBRL(activePoint.va)}</span>
          )}
          {activePoint.cr !== null && (
            <span style={{ color: "#b91c1c" }}>CR: {fmtBRL(activePoint.cr)}</span>
          )}
          {activePoint.entProj !== null && (
            <span style={{ color: "#7e22ce" }}>ENT: {fmtBRL(activePoint.entProj)}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default function PreditivaPage() {
  const [aba, setAba] = useState<"evm" | "pert" | "crashing">("evm");
  const [frenteSel, setFrenteSel] = useState<"PROJETO" | "PREDITIVA" | "AGIL">("PROJETO");
  const [soCriticas, setSoCriticas] = useState(false);
  const [reducoes, setReducoes] = useState<Record<string, number>>({});
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/preditiva", { cache: "no-store" });
      const json = (await res.json()) as Partial<ApiData> & { error?: string };
      if (!res.ok) throw new Error(json.error || "Erro ao carregar dados preditivos.");
      setData({
        evm: Array.isArray(json.evm) ? json.evm : [],
        pert: Array.isArray(json.pert) ? json.pert : [],
        atividades: Array.isArray(json.atividades) ? json.atividades : [],
        orcamento: Array.isArray(json.orcamento) ? json.orcamento : [],
        cenarios: Array.isArray(json.cenarios) ? json.cenarios : [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro de rede ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const evmRow = useMemo(() => {
    if (!data?.evm.length) return null;
    return (
      data.evm.find((r) => pickStr(r, ["frente"]).toUpperCase() === frenteSel) ??
      data.evm[0]
    );
  }, [data, frenteSel]);

  const curvaSPoints: CurvaSPoint[] = useMemo(() => {
    if (!evmRow) return [];
    const ont = pickNum(evmRow, ["ont_rs"]) ?? 0;
    const vp = pickNum(evmRow, ["vp_rs"]) ?? 0;
    const va = pickNum(evmRow, ["va_rs"]) ?? 0;
    const cr = pickNum(evmRow, ["cr_rs"]) ?? 0;
    const ent = pickNum(evmRow, ["ent_tipica_rs"]) ?? cr + Math.max(ont - va, 0);
    const corte = pickStr(evmRow, ["data_corte"]) || "Corte Atual";

    return [
      { label: "Início (0%)", vp: 0, va: 0, cr: 0, entProj: null },
      { label: "25% Prazo", vp: vp * 0.28, va: va * 0.25, cr: cr * 0.27, entProj: null },
      { label: "50% Prazo", vp: vp * 0.62, va: va * 0.58, cr: cr * 0.61, entProj: null },
      { label: `Corte (${corte})`, vp, va, cr, entProj: cr },
      { label: "Término (ONT/ENT)", vp: ont, va: null, cr: null, entProj: ent },
    ];
  }, [evmRow]);

  const pertItems: PertItem[] = useMemo(() => {
    if (!data) return [];
    const ativNameMap = new Map<string, string>();
    for (const a of data.atividades) {
      const id = pickStr(a, ["id_atividade", "id"]);
      const nome = pickStr(a, ["nome_atividade", "nome", "descricao"]);
      if (id && nome) ativNameMap.set(id.toUpperCase(), nome);
    }

    const sourceRows = data.pert.length > 0 ? data.pert : data.atividades;
    let cursor = 1;

    return sourceRows.map((row, idx) => {
      const id = pickStr(row, ["id_atividade", "id"]) || `A${idx + 1}`;
      const nome =
        pickStr(row, ["nome_atividade", "nome", "descricao"]) ||
        ativNameMap.get(id.toUpperCase()) ||
        `Atividade ${id}`;

      const o = pickNum(row, ["duracao_otimista_du"]);
      const m = pickNum(row, ["duracao_mais_provavel_du"]);
      const p = pickNum(row, ["duracao_pessimista_du"]);
      const teCalc =
        o !== null && m !== null && p !== null ? Math.ceil((o + 4 * m + p) / 6) : null;

      const duracao =
        pickNum(row, [
          "duracao_du",
          "dur_du",
          "duracao_esperada_du",
          "te_du",
          "duracao_fixa_du",
          "duracao",
        ]) ??
        teCalc ??
        5;

      const es =
        pickNum(row, ["es_du", "es", "inicio_cedo_du", "inicio_cedo", "ic_du", "ic"]) ??
        cursor;
      const ef =
        pickNum(row, ["ef_du", "ef", "termino_cedo_du", "termino_cedo", "tc_du", "tc"]) ??
        es + duracao - 1;

      const folgaRaw = pickNum(row, [
        "folga_total_du",
        "folga_total",
        "folga_du",
        "folga",
        "ft_du",
        "ft",
        "tf_du",
        "tf",
        "total_float_du",
        "total_float",
        "slack_du",
        "slack",
      ]);
      const lsRaw = pickNum(row, ["ls_du", "ls", "inicio_tarde_du", "inicio_tarde", "it_du", "it"]);
      const lfRaw = pickNum(row, ["lf_du", "lf", "termino_tarde_du", "termino_tarde", "tt_du", "tt"]);

      const ls = lsRaw ?? (folgaRaw !== null ? es + folgaRaw : es);
      const lf = lfRaw ?? (folgaRaw !== null ? ef + folgaRaw : ef);
      const folga = folgaRaw ?? Math.max(0, ls - es);

      const critFlag = pickBool(row, [
        "caminho_critico",
        "e_critica",
        "critica",
        "is_critica",
        "critico",
      ]);
      const critica = critFlag !== null ? critFlag : folga <= 0;

      cursor = ef + 1;
      return { id, nome, duracao, es, ef, ls, lf, folga, critica };
    });
  }, [data]);

  const pertStats = useMemo(() => {
    const duracaoTotal = pertItems.reduce((acc, item) => Math.max(acc, item.ef, item.lf), 1);
    const criticas = pertItems.filter((i) => i.critica).length;
    return { total: pertItems.length, criticas, duracaoTotal };
  }, [pertItems]);

  const pertFiltered = useMemo(
    () => (soCriticas ? pertItems.filter((i) => i.critica) : pertItems),
    [pertItems, soCriticas]
  );

  const custoAtrasoDu = useMemo(() => {
    const firstCen = data?.cenarios?.[0];
    return (firstCen ? pickNum(firstCen, ["custo_atraso_por_du_rs"]) : null) ?? 12000;
  }, [data]);

  const crashItems: CrashItem[] = useMemo(() => {
    if (!data) return [];
    const orcMap = new Map<string, number>();
    for (const o of data.orcamento) {
      const id = pickStr(o, ["id_atividade"]).toUpperCase();
      const val = pickNum(o, ["valor_orcado_rs", "valor_rs", "custo_orcado_rs"]) ?? 0;
      if (id) orcMap.set(id, (orcMap.get(id) ?? 0) + val);
    }

    const critSet = new Set(
      pertItems.filter((p) => p.critica).map((p) => p.id.toUpperCase())
    );

    return data.atividades
      .filter((a) => pickStr(a, ["tipo_atividade"]).toUpperCase() !== "MARCO_AGIL")
      .map((a) => {
        const id = pickStr(a, ["id_atividade", "id"]) || "A?";
        const nome = pickStr(a, ["nome_atividade", "nome", "descricao"]) || id;
        const pertMatch = pertItems.find((p) => p.id.toUpperCase() === id.toUpperCase());

        const durNormal =
          pertMatch?.duracao ??
          pickNum(a, ["duracao_mais_provavel_du", "duracao_fixa_du"]) ??
          10;

        const durOtimista = pickNum(a, ["duracao_otimista_du"]);
        const durCrash =
          pickNum(a, ["duracao_crash_du", "duracao_minima_du", "duracao_acelerada_du"]) ??
          (durOtimista !== null
            ? Math.min(durNormal, Math.max(1, Math.round(durOtimista)))
            : Math.max(1, Math.round(durNormal * 0.7)));

        const maxReducao = Math.max(0, durNormal - durCrash);
        const custoNormal =
          orcMap.get(id.toUpperCase()) ??
          pickNum(a, ["custo_normal_rs", "valor_orcado_rs"]) ??
          durNormal * 6500;

        const slopeDb = pickNum(a, ["custo_aceleracao_por_du_rs", "cost_slope_rs"]);
        const custoCrashDb = pickNum(a, ["custo_crash_rs", "custo_acelerado_rs"]);

        let slope = 0;
        let custoCrash = custoNormal;

        if (maxReducao > 0) {
          if (slopeDb !== null) {
            slope = slopeDb;
            custoCrash = custoNormal + slope * maxReducao;
          } else if (custoCrashDb !== null && custoCrashDb >= custoNormal) {
            custoCrash = custoCrashDb;
            slope = (custoCrash - custoNormal) / maxReducao;
          } else {
            custoCrash = Math.round(custoNormal * 1.28);
            slope = Math.round((custoCrash - custoNormal) / maxReducao);
          }
        }

        return {
          id,
          nome,
          critica: critSet.has(id.toUpperCase()),
          duracaoNormal: durNormal,
          duracaoCrash: durCrash,
          maxReducao,
          custoNormal,
          custoCrash,
          slope,
        };
      })
      .filter((item) => item.maxReducao > 0)
      .sort((a, b) => {
        if (a.critica !== b.critica) return a.critica ? -1 : 1;
        return a.slope - b.slope;
      });
  }, [data, pertItems]);

  const crashSummary = useMemo(() => {
    let diasReduzidos = 0;
    let custoAdicional = 0;
    for (const item of crashItems) {
      const r = Math.min(reducoes[item.id] ?? 0, item.maxReducao);
      diasReduzidos += r;
      custoAdicional += r * item.slope;
    }
    const economiaAtraso = diasReduzidos * custoAtrasoDu;
    const saldoLiquido = economiaAtraso - custoAdicional;
    return {
      diasReduzidos,
      custoAdicional,
      economiaAtraso,
      saldoLiquido,
      novaDuracao: Math.max(1, pertStats.duracaoTotal - diasReduzidos),
    };
  }, [crashItems, reducoes, custoAtrasoDu, pertStats.duracaoTotal]);

  const ajustarReducao = (id: string, max: number, delta: number) => {
    setReducoes((prev) => {
      const atual = prev[id] ?? 0;
      const prox = Math.max(0, Math.min(max, atual + delta));
      return { ...prev, [id]: prox };
    });
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--canvas, #f8fafc)",
        color: "var(--ink, #0f172a)",
        fontFamily: "inherit",
      }}
    >
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
                Lume Educação — Frente Preditiva (R4–R6)
              </div>
              <div style={{ fontSize: "12px", color: "var(--muted, #64748b)" }}>
                Rede PERT/CPM, Crashing e Curva S / EVM conectados ao Supabase
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
            <Link href="/mapa-3d" className="lume-btn-ghost" style={{ textDecoration: "none" }}>
              <Box size={15} />
              <span>Mapa 3D</span>
            </Link>
            <button
              type="button"
              onClick={() => void loadData()}
              className="lume-btn-ghost"
              title="Recarregar views do Supabase"
            >
              <RefreshCw size={15} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>
      </header>

      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "20px 20px 48px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
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
              border:
                aba === "crashing" ? "1px solid #081628" : "1px solid var(--border, #d8dee9)",
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
          <div style={{ padding: "48px 16px", textAlign: "center", color: "var(--muted, #64748b)" }}>
            Carregando views SQL da frente preditiva no Supabase...
          </div>
        ) : (
          <>
            {aba === "evm" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--muted, #64748b)" }}>
                    Visão da Curva S:
                  </span>
                  {(["PROJETO", "PREDITIVA", "AGIL"] as const).map((fr) => (
                    <button
                      key={fr}
                      type="button"
                      onClick={() => setFrenteSel(fr)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "999px",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        border:
                          frenteSel === fr
                            ? "1px solid #081628"
                            : "1px solid var(--border, #cbd5e1)",
                        background: frenteSel === fr ? "#081628" : "transparent",
                        color: frenteSel === fr ? "#ffffff" : "var(--ink, #0f172a)",
                      }}
                    >
                      {fr === "PROJETO"
                        ? "Projeto Total"
                        : fr === "PREDITIVA"
                          ? "Frente Preditiva"
                          : "Frente Ágil"}
                    </button>
                  ))}
                </div>

                {evmRow && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                      gap: "12px",
                    }}
                  >
                    <div style={{ ...cardStyle, padding: "14px 16px", borderLeft: "4px solid #2563eb" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted, #64748b)" }}>
                        VALOR PLANEJADO (VP)
                      </div>
                      <div style={{ marginTop: "6px", fontSize: "18px", fontWeight: 700 }}>
                        {fmtBRL(pickNum(evmRow, ["vp_rs"]))}
                      </div>
                    </div>

                    <div style={{ ...cardStyle, padding: "14px 16px", borderLeft: "4px solid #10b981" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted, #64748b)" }}>
                        VALOR AGREGADO (VA)
                      </div>
                      <div style={{ marginTop: "6px", fontSize: "18px", fontWeight: 700, color: "#065f46" }}>
                        {fmtBRL(pickNum(evmRow, ["va_rs"]))}
                      </div>
                    </div>

                    <div style={{ ...cardStyle, padding: "14px 16px", borderLeft: "4px solid #ef4444" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted, #64748b)" }}>
                        CUSTO REAL (CR)
                      </div>
                      <div style={{ marginTop: "6px", fontSize: "18px", fontWeight: 700, color: "#991b1b" }}>
                        {fmtBRL(pickNum(evmRow, ["cr_rs"]))}
                      </div>
                    </div>

                    <div style={{ ...cardStyle, padding: "14px 16px", borderLeft: "4px solid #f59e0b" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted, #64748b)" }}>
                        IDP / IDC
                      </div>
                      <div style={{ marginTop: "6px", fontSize: "18px", fontWeight: 700 }}>
                        {fmtNum(pickNum(evmRow, ["idp"]), 3)} / {fmtNum(pickNum(evmRow, ["idc"]), 3)}
                      </div>
                    </div>

                    <div style={{ ...cardStyle, padding: "14px 16px", borderLeft: "4px solid #9333ea" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted, #64748b)" }}>
                        PREVISÃO TÍPICA (ENT)
                      </div>
                      <div style={{ marginTop: "6px", fontSize: "18px", fontWeight: 700, color: "#7e22ce" }}>
                        {fmtBRL(pickNum(evmRow, ["ent_tipica_rs"]))}
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ ...cardStyle, padding: "20px" }}>
                  <h2 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 700 }}>
                    Curva S — Desempenho de Prazo e Custo ({frenteSel})
                  </h2>
                  {curvaSPoints.length > 0 ? (
                    <CurvaSChart points={curvaSPoints} />
                  ) : (
                    <p style={{ margin: 0, color: "var(--muted, #64748b)", fontSize: "13.5px" }}>
                      Sem registros em vw_evm_resumo.
                    </p>
                  )}
                </div>

                <div style={{ ...cardStyle, padding: "20px" }}>
                  <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 700 }}>
                    Tabela Consolidada EVM (vw_evm_resumo)
                  </h3>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ background: "var(--canvas, #f8fafc)", textAlign: "left" }}>
                          <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>Frente</th>
                          <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>ONT</th>
                          <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>VP</th>
                          <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>VA</th>
                          <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>CR</th>
                          <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>IDP</th>
                          <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>IDC</th>
                          <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>ENT Típica</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data?.evm ?? []).map((row, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px 12px", fontWeight: 700 }}>
                              {pickStr(row, ["frente"]) || `Linha ${idx + 1}`}
                            </td>
                            <td style={{ padding: "10px 12px" }}>{fmtBRL(pickNum(row, ["ont_rs"]))}</td>
                            <td style={{ padding: "10px 12px" }}>{fmtBRL(pickNum(row, ["vp_rs"]))}</td>
                            <td style={{ padding: "10px 12px" }}>{fmtBRL(pickNum(row, ["va_rs"]))}</td>
                            <td style={{ padding: "10px 12px" }}>{fmtBRL(pickNum(row, ["cr_rs"]))}</td>
                            <td style={{ padding: "10px 12px", fontWeight: 600 }}>
                              {fmtNum(pickNum(row, ["idp"]), 3)}
                            </td>
                            <td style={{ padding: "10px 12px", fontWeight: 600 }}>
                              {fmtNum(pickNum(row, ["idc"]), 3)}
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              {fmtBRL(pickNum(row, ["ent_tipica_rs"]))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {aba === "pert" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "12px",
                  }}
                >
                  <div style={{ ...cardStyle, padding: "14px 16px", borderLeft: "4px solid #081628" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted, #64748b)" }}>
                      ATIVIDADES NA REDE
                    </div>
                    <div style={{ marginTop: "6px", fontSize: "20px", fontWeight: 700 }}>
                      {pertStats.total}
                    </div>
                  </div>
                  <div style={{ ...cardStyle, padding: "14px 16px", borderLeft: "4px solid #ef4444" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#991b1b" }}>
                      CAMINHO CRÍTICO (FOLGA = 0)
                    </div>
                    <div style={{ marginTop: "6px", fontSize: "20px", fontWeight: 700, color: "#991b1b" }}>
                      {pertStats.criticas} atividades
                    </div>
                  </div>
                  <div style={{ ...cardStyle, padding: "14px 16px", borderLeft: "4px solid #c9a227" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted, #64748b)" }}>
                      DURAÇÃO TOTAL DA REDE
                    </div>
                    <div style={{ marginTop: "6px", fontSize: "20px", fontWeight: 700 }}>
                      {pertStats.duracaoTotal} du
                    </div>
                  </div>
                </div>

                <div style={{ ...cardStyle, padding: "20px" }}>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "14px",
                    }}
                  >
                    <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>
                      Cronograma PERT/CPM — Caminho Crítico e Folgas
                    </h2>
                    <button
                      type="button"
                      onClick={() => setSoCriticas((v) => !v)}
                      className="lume-btn-ghost"
                      style={{ fontSize: "12.5px", padding: "6px 12px" }}
                    >
                      {soCriticas ? "Mostrar todas as atividades" : "Filtrar só caminho crítico"}
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {pertFiltered.map((item) => {
                      const leftPct = Math.max(0, ((item.es - 1) / pertStats.duracaoTotal) * 100);
                      const widthPct = Math.max(2, (item.duracao / pertStats.duracaoTotal) * 100);
                      const slackPct = Math.max(0, (item.folga / pertStats.duracaoTotal) * 100);

                      return (
                        <div
                          key={item.id}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "220px minmax(0, 1fr) 86px",
                            gap: "10px",
                            alignItems: "center",
                            fontSize: "12.5px",
                          }}
                        >
                          <div
                            style={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              fontWeight: item.critica ? 700 : 500,
                              color: item.critica ? "#991b1b" : "var(--ink, #0f172a)",
                            }}
                            title={`${item.id} — ${item.nome}`}
                          >
                            {item.id} · {item.nome}
                          </div>

                          <div
                            style={{
                              position: "relative",
                              height: "22px",
                              background: "var(--canvas, #f1f5f9)",
                              borderRadius: "6px",
                              overflow: "hidden",
                            }}
                          >
                            {slackPct > 0 && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: "7px",
                                  bottom: "7px",
                                  left: `${Math.min(100, leftPct + widthPct)}%`,
                                  width: `${Math.min(100 - leftPct - widthPct, slackPct)}%`,
                                  background: "#cbd5e1",
                                  borderRadius: "3px",
                                }}
                                title={`Folga total: ${item.folga} du`}
                              />
                            )}
                            <div
                              style={{
                                position: "absolute",
                                top: "3px",
                                bottom: "3px",
                                left: `${Math.min(98, leftPct)}%`,
                                width: `${Math.min(100 - leftPct, widthPct)}%`,
                                background: item.critica ? "#ef4444" : "#081628",
                                borderRadius: "4px",
                              }}
                              title={`ES: ${item.es} | EF: ${item.ef} | Duração: ${item.duracao} du`}
                            />
                          </div>

                          <div
                            style={{
                              textAlign: "right",
                              fontWeight: 700,
                              fontSize: "11.5px",
                              color: item.critica ? "#b91c1c" : "var(--muted, #64748b)",
                            }}
                          >
                            {item.critica ? "CRÍTICA" : `+${item.folga} du`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ ...cardStyle, padding: "20px" }}>
                  <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 700 }}>
                    Tabela Completa PERT / CPM (vw_rede_pert_cpm)
                  </h3>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ background: "var(--canvas, #f8fafc)", textAlign: "left" }}>
                          <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>ID</th>
                          <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>Atividade</th>
                          <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>Duração</th>
                          <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>ES</th>
                          <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>EF</th>
                          <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>LS</th>
                          <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>LF</th>
                          <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>Folga</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pertFiltered.map((row) => (
                          <tr key={row.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "9px 12px", fontWeight: 700 }}>{row.id}</td>
                            <td style={{ padding: "9px 12px" }}>{row.nome}</td>
                            <td style={{ padding: "9px 12px" }}>{row.duracao} du</td>
                            <td style={{ padding: "9px 12px" }}>{row.es}</td>
                            <td style={{ padding: "9px 12px" }}>{row.ef}</td>
                            <td style={{ padding: "9px 12px" }}>{row.ls}</td>
                            <td style={{ padding: "9px 12px" }}>{row.lf}</td>
                            <td
                              style={{
                                padding: "9px 12px",
                                fontWeight: 700,
                                color: row.critica ? "#b91c1c" : "inherit",
                              }}
                            >
                              {row.folga} du {row.critica ? "(Crítico)" : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {aba === "crashing" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "12px",
                  }}
                >
                  <div style={{ ...cardStyle, padding: "14px 16px", borderLeft: "4px solid #081628" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted, #64748b)" }}>
                      DIAS COMPRIMIDOS
                    </div>
                    <div style={{ marginTop: "6px", fontSize: "20px", fontWeight: 700 }}>
                      -{crashSummary.diasReduzidos} du ({crashSummary.novaDuracao} du)
                    </div>
                  </div>
                  <div style={{ ...cardStyle, padding: "14px 16px", borderLeft: "4px solid #ef4444" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#991b1b" }}>
                      CUSTO ADICIONAL (CRASH)
                    </div>
                    <div style={{ marginTop: "6px", fontSize: "20px", fontWeight: 700, color: "#991b1b" }}>
                      {fmtBRL(crashSummary.custoAdicional)}
                    </div>
                  </div>
                  <div style={{ ...cardStyle, padding: "14px 16px", borderLeft: "4px solid #10b981" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#065f46" }}>
                      ECONOMIA EM ATRASO ({fmtBRL(custoAtrasoDu)}/du)
                    </div>
                    <div style={{ marginTop: "6px", fontSize: "20px", fontWeight: 700, color: "#065f46" }}>
                      {fmtBRL(crashSummary.economiaAtraso)}
                    </div>
                  </div>
                  <div style={{ ...cardStyle, padding: "14px 16px", borderLeft: "4px solid #c9a227" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted, #64748b)" }}>
                      SALDO LÍQUIDO DA COMPRESSÃO
                    </div>
                    <div
                      style={{
                        marginTop: "6px",
                        fontSize: "20px",
                        fontWeight: 700,
                        color: crashSummary.saldoLiquido >= 0 ? "#065f46" : "#991b1b",
                      }}
                    >
                      {fmtBRL(crashSummary.saldoLiquido)}
                    </div>
                  </div>
                </div>

                <div style={{ ...cardStyle, padding: "20px" }}>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "14px",
                    }}
                  >
                    <div>
                      <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>
                        Simulador de Crashing — Ordenado por Menor Cost Slope (R$/du)
                      </h2>
                      <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "var(--muted, #64748b)" }}>
                        Toque em + / − para comprimir dias nas atividades críticas e comparar o custo marginal contra o custo do atraso.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReducoes({})}
                      className="lume-btn-ghost"
                      style={{ fontSize: "12.5px", padding: "6px 12px" }}
                    >
                      Zerar simulação
                    </button>
                  </div>

                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ background: "var(--canvas, #f8fafc)", textAlign: "left" }}>
                          <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>Atividade</th>
                          <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>Normal</th>
                          <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>Limite Crash</th>
                          <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>Custo Normal</th>
                          <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>Cost Slope</th>
                          <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>Comprimir</th>
                        </tr>
                      </thead>
                      <tbody>
                        {crashItems.map((item) => {
                          const red = reducoes[item.id] ?? 0;
                          return (
                            <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "10px 12px", fontWeight: 600 }}>
                                {item.id} — {item.nome}{" "}
                                {item.critica && (
                                  <span
                                    style={{
                                      marginLeft: "6px",
                                      padding: "2px 7px",
                                      borderRadius: "999px",
                                      fontSize: "10.5px",
                                      fontWeight: 700,
                                      background: "#fee2e2",
                                      color: "#991b1b",
                                    }}
                                  >
                                    Crítica
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: "10px 12px" }}>{item.duracaoNormal} du</td>
                              <td style={{ padding: "10px 12px" }}>{item.duracaoCrash} du</td>
                              <td style={{ padding: "10px 12px" }}>{fmtBRL(item.custoNormal)}</td>
                              <td style={{ padding: "10px 12px", fontWeight: 700 }}>
                                {fmtBRL(item.slope)} / du
                              </td>
                              <td style={{ padding: "10px 12px" }}>
                                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                                  <button
                                    type="button"
                                    onClick={() => ajustarReducao(item.id, item.maxReducao, -1)}
                                    disabled={red <= 0}
                                    className="lume-btn-ghost"
                                    style={{ padding: "3px 9px", fontWeight: 700 }}
                                  >
                                    −
                                  </button>
                                  <span style={{ minWidth: "46px", textAlign: "center", fontWeight: 700 }}>
                                    -{red} / {item.maxReducao}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => ajustarReducao(item.id, item.maxReducao, 1)}
                                    disabled={red >= item.maxReducao}
                                    className="lume-btn-ghost"
                                    style={{ padding: "3px 9px", fontWeight: 700 }}
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
