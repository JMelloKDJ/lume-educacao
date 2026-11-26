'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BOLETINS_CONFIG,
  BoletimDef,
  validateBoletimPayload,
} from '@/lib/boletins-config';

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
        : f.type === 'select' && f.options?.length
          ? f.options[0]
          : '';
  }
  return init;
}

function fmtBRL(v: number | null | undefined) {
  if (v === null || v === undefined) return '—';
  return Number(v).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

export default function LancamentosPage() {
  const [modo, setModo] = useState<'quinzena' | 'surpresa'>('quinzena');
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
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [controles, setControles] = useState<ControleRow[]>([]);
  const [evmProjeto, setEvmProjeto] = useState<EvmRow | null>(null);

  const [surpresaAtrasoOn, setSurpresaAtrasoOn] = useState(true);
  const [surpresaMudancaOn, setSurpresaMudancaOn] = useState(true);
  const [surpresaCartaoOn, setSurpresaCartaoOn] = useState(true);

  const [surpresaAtraso, setSurpresaAtraso] = useState<Record<string, string>>({
    id_ocorrencia: 'OC-SURP-01',
    data: '2026-11-25',
    id_risco: 'R05',
    descricao: 'Atraso comunicado ao vivo no Boletim Surpresa',
    frente: 'PREDITIVA',
    id_atividade: 'A19',
    impacto_custo_real_rs: '0',
    impacto_prazo_real_du: '5',
    custo_ja_incluido_em_pagamentos: 'NAO',
  });

  const [surpresaMudanca, setSurpresaMudanca] = useState<Record<string, string>>({
    id_mudanca: 'SM-SURP-01',
    data_abertura: '2026-11-25',
    id_solicitante: 'PI01',
    descricao: 'Mudança aprovada ao vivo pelo Comitê',
    tipo_mudanca: 'ESCOPO',
    frente: 'AGIL',
    id_atividade: '',
    impacto_custo_rs: '15000',
    impacto_prazo_du: '0',
    impacto_pontos: '8',
    status: 'APROVADA',
    data_decisao: '2026-11-25',
    nivel_decisor: 'COMITE',
    implementada: 'NAO',
  });

  const [surpresaCartao, setSurpresaCartao] = useState<Record<string, string>>({
    id_transicao: 'TR-SURP-01',
    id_item: 'LU-156',
    data: '2026-11-25',
    status_origem: 'EM_TESTE',
    status_destino: 'CONCLUIDO',
    id_pessoa: 'P17',
  });

  const fetchRows = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/boletins?boletimId=${encodeURIComponent(id)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao carregar registros.');
      setRows(json.data ?? []);
    } catch (e) {
      setFeedback({ type: 'err', text: e instanceof Error ? e.message : 'Erro ao listar.' });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchResumo = useCallback(async () => {
    try {
      const res = await fetch('/api/boletins?mode=resumo');
      const json = await res.json();
      if (res.ok) {
        setControles(json.controles ?? []);
        const proj = (json.evm ?? []).find((x: EvmRow) => x.frente === 'PROJETO') ?? null;
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
      setFeedback({ type: 'err', text: check.errors.join(' ') });
      return;
    }

    setSaving(true);
    try {
      const method = editingKeys ? 'PATCH' : 'POST';
      const res = await fetch('/api/boletins', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boletimId: boletim.id,
          keys: editingKeys,
          data: formData,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Falha ao gravar no Supabase.');

      setFeedback({ type: 'ok', text: json.message });
      setFormData(buildDefaults(boletim));
      setEditingKeys(null);
      await Promise.all([fetchRows(boletim.id), fetchResumo()]);
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Erro ao salvar.' });
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
      populated[f.name] = val === null || val === undefined ? '' : String(val);
    }
    setEditingKeys(keys);
    setFormData(populated);
    setFeedback({ type: 'ok', text: `Editando registro selecionado de ${boletim.codigo}.` });
  }

  async function handleDelete(row: Record<string, unknown>) {
    if (!window.confirm('Deseja realmente excluir este lançamento do Supabase?')) return;
    const keys: Record<string, unknown> = {};
    for (const pk of boletim.pkColumns) keys[pk] = row[pk];

    setSaving(true);
    try {
      const res = await fetch('/api/boletins', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boletimId: boletim.id, keys }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao excluir.');
      setFeedback({ type: 'ok', text: json.message });
      await Promise.all([fetchRows(boletim.id), fetchResumo()]);
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Erro ao excluir.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitSurpresa(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setSaving(true);
    try {
      const res = await fetch('/api/boletins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'boletim_surpresa',
          atraso: { enabled: surpresaAtrasoOn, data: surpresaAtraso },
          mudanca: { enabled: surpresaMudancaOn, data: surpresaMudanca },
          cartao: { enabled: surpresaCartaoOn, data: surpresaCartao },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao gravar Boletim Surpresa.');
      setFeedback({
        type: 'ok',
        text: `${json.message} ${Array.isArray(json.detalhes) ? json.detalhes.join(' | ') : ''}`,
      });
      await fetchResumo();
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Erro ao lançar.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 text-slate-900">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <span className="inline-block rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
            R1–R3 · Schema lume_educacao · Views SQL Reativas
          </span>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-900">
            CRUD Quinzena de Campo (B1–B10) &amp; Boletim Surpresa
          </h1>
          <p className="text-sm text-slate-600">
            Toda gravação atualiza instantaneamente <code>vw_numeros_controle</code>, <code>vw_evm_resumo</code> e <code>vw_rede_pert_cpm</code>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            ← Voltar para a IA
          </Link>
          <button
            type="button"
            onClick={() => setModo('quinzena')}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              modo === 'quinzena'
                ? 'bg-violet-600 text-white shadow'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Quinzena (B1–B10)
          </button>
          <button
            type="button"
            onClick={() => setModo('surpresa')}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              modo === 'surpresa'
                ? 'bg-rose-600 text-white shadow'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            ⚡ Boletim Surpresa (Ao Vivo)
          </button>
        </div>
      </div>

      {evmProjeto && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-3">
            <div className="text-[11px] font-bold text-violet-700">DATA DE CORTE (EVM)</div>
            <div className="mt-1 text-lg font-extrabold text-slate-900">{evmProjeto.data_corte}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-[11px] font-bold text-slate-500">VALOR AGREGADO (VA)</div>
            <div className="mt-1 text-lg font-extrabold text-slate-900">{fmtBRL(evmProjeto.va_rs)}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-[11px] font-bold text-slate-500">CUSTO REAL (CR)</div>
            <div className="mt-1 text-lg font-extrabold text-slate-900">{fmtBRL(evmProjeto.cr_rs)}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-[11px] font-bold text-slate-500">IDP / IDC</div>
            <div className="mt-1 text-lg font-extrabold text-violet-700">
              {evmProjeto.idp?.toFixed(3)} / {evmProjeto.idc?.toFixed(3)}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-[11px] font-bold text-slate-500">ENT TÍPICA</div>
            <div className="mt-1 text-lg font-extrabold text-rose-700">{fmtBRL(evmProjeto.ent_tipica_rs)}</div>
          </div>
        </div>
      )}

      {controles.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {controles.slice(0, 7).map((c) => (
            <div key={c.codigo} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="truncate text-[10px] font-semibold text-slate-500" title={c.metrica}>
                {c.metrica}
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-base font-extrabold text-slate-900">
                  {Number(c.atual_dinamico).toLocaleString('pt-BR')}
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    c.status_13_11 === 'OK'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {c.status_13_11}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {feedback && (
        <div
          className={`mb-5 rounded-xl border px-4 py-3 text-sm font-medium ${
            feedback.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {modo === 'surpresa' ? (
        <form onSubmit={handleSubmitSurpresa} className="space-y-6">
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm">
              <label className="mb-3 flex items-center gap-2 font-bold text-rose-700">
                <input
                  type="checkbox"
                  checked={surpresaAtrasoOn}
                  onChange={(e) => setSurpresaAtrasoOn(e.target.checked)}
                />
                1. Atraso Comunicado (Risco/Ocorrência)
              </label>
              <div className="space-y-2 text-sm">
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="ID Ocorrência"
                  value={surpresaAtraso.id_ocorrencia}
                  onChange={(e) => setSurpresaAtraso({ ...surpresaAtraso, id_ocorrencia: e.target.value })}
                />
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  type="date"
                  value={surpresaAtraso.data}
                  onChange={(e) => setSurpresaAtraso({ ...surpresaAtraso, data: e.target.value })}
                />
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="Atividade impactada (ex: A19, A32)"
                  value={surpresaAtraso.id_atividade}
                  onChange={(e) => setSurpresaAtraso({ ...surpresaAtraso, id_atividade: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="w-full rounded-lg border px-3 py-2"
                    type="number"
                    placeholder="Prazo (du)"
                    value={surpresaAtraso.impacto_prazo_real_du}
                    onChange={(e) => setSurpresaAtraso({ ...surpresaAtraso, impacto_prazo_real_du: e.target.value })}
                  />
                  <input
                    className="w-full rounded-lg border px-3 py-2"
                    type="number"
                    placeholder="Custo (R$)"
                    value={surpresaAtraso.impacto_custo_real_rs}
                    onChange={(e) => setSurpresaAtraso({ ...surpresaAtraso, impacto_custo_real_rs: e.target.value })}
                  />
                </div>
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="Descrição"
                  value={surpresaAtraso.descricao}
                  onChange={(e) => setSurpresaAtraso({ ...surpresaAtraso, descricao: e.target.value })}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
              <label className="mb-3 flex items-center gap-2 font-bold text-amber-700">
                <input
                  type="checkbox"
                  checked={surpresaMudancaOn}
                  onChange={(e) => setSurpresaMudancaOn(e.target.checked)}
                />
                2. Mudança Aprovada (SM)
              </label>
              <div className="space-y-2 text-sm">
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="ID Mudança"
                  value={surpresaMudanca.id_mudanca}
                  onChange={(e) => setSurpresaMudanca({ ...surpresaMudanca, id_mudanca: e.target.value })}
                />
                <input
                  className="w-full rounded-lg border px-3 py-2"
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
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="Descrição"
                  value={surpresaMudanca.descricao}
                  onChange={(e) => setSurpresaMudanca({ ...surpresaMudanca, descricao: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="w-full rounded-lg border px-3 py-2"
                    type="number"
                    placeholder="Custo (R$)"
                    value={surpresaMudanca.impacto_custo_rs}
                    onChange={(e) => setSurpresaMudanca({ ...surpresaMudanca, impacto_custo_rs: e.target.value })}
                  />
                  <input
                    className="w-full rounded-lg border px-3 py-2"
                    type="number"
                    placeholder="Pontos"
                    value={surpresaMudanca.impacto_pontos}
                    onChange={(e) => setSurpresaMudanca({ ...surpresaMudanca, impacto_pontos: e.target.value })}
                  />
                </div>
                <select
                  className="w-full rounded-lg border px-3 py-2"
                  value={surpresaMudanca.nivel_decisor}
                  onChange={(e) => setSurpresaMudanca({ ...surpresaMudanca, nivel_decisor: e.target.value })}
                >
                  <option value="GERENTE">GERENTE</option>
                  <option value="PATROCINADOR">PATROCINADOR</option>
                  <option value="COMITE">COMITE</option>
                </select>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
              <label className="mb-3 flex items-center gap-2 font-bold text-emerald-700">
                <input
                  type="checkbox"
                  checked={surpresaCartaoOn}
                  onChange={(e) => setSurpresaCartaoOn(e.target.checked)}
                />
                3. Cartão Movido no Quadro
              </label>
              <div className="space-y-2 text-sm">
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="ID Transição"
                  value={surpresaCartao.id_transicao}
                  onChange={(e) => setSurpresaCartao({ ...surpresaCartao, id_transicao: e.target.value })}
                />
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  type="date"
                  value={surpresaCartao.data}
                  onChange={(e) => setSurpresaCartao({ ...surpresaCartao, data: e.target.value })}
                />
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="ID Item (ex: LU-156)"
                  value={surpresaCartao.id_item}
                  onChange={(e) => setSurpresaCartao({ ...surpresaCartao, id_item: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    className="w-full rounded-lg border px-3 py-2"
                    value={surpresaCartao.status_origem}
                    onChange={(e) => setSurpresaCartao({ ...surpresaCartao, status_origem: e.target.value })}
                  >
                    <option value="A_FAZER">A_FAZER</option>
                    <option value="EM_ANDAMENTO">EM_ANDAMENTO</option>
                    <option value="EM_REVISAO">EM_REVISAO</option>
                    <option value="EM_TESTE">EM_TESTE</option>
                  </select>
                  <select
                    className="w-full rounded-lg border px-3 py-2"
                    value={surpresaCartao.status_destino}
                    onChange={(e) => setSurpresaCartao({ ...surpresaCartao, status_destino: e.target.value })}
                  >
                    <option value="EM_ANDAMENTO">EM_ANDAMENTO</option>
                    <option value="EM_REVISAO">EM_REVISAO</option>
                    <option value="EM_TESTE">EM_TESTE</option>
                    <option value="CONCLUIDO">CONCLUIDO</option>
                  </select>
                </div>
                <input
                  className="w-full rounded-lg border px-3 py-2"
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
            className="w-full rounded-full bg-rose-600 px-6 py-3 font-bold text-white shadow hover:bg-rose-700 disabled:opacity-50"
          >
            {saving ? 'Gravando no Supabase...' : '⚡ Lançar Boletim Surpresa e Recalcular Views'}
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {BOLETINS_CONFIG.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedId(b.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                  b.id === boletim.id
                    ? 'border-violet-600 bg-violet-600 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {b.codigo} · {b.titulo.split(' ')[0]}
              </button>
            ))}
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {boletim.codigo} — {boletim.titulo}
                </h2>
                <p className="text-xs text-slate-500">{boletim.descricao}</p>
              </div>
              {editingKeys && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingKeys(null);
                    setFormData(buildDefaults(boletim));
                  }}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                >
                  Cancelar Edição
                </button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {boletim.fields.map((field) => (
                <div key={field.name}>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                      value={formData[field.name] ?? ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      required={field.required}
                    >
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt || '(vazio)'}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      type={field.type}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      placeholder={field.placeholder}
                      value={formData[field.name] ?? ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      required={field.required}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-violet-600 px-6 py-2.5 text-sm font-bold text-white shadow hover:bg-violet-700 disabled:opacity-50"
              >
                {saving
                  ? 'Salvando...'
                  : editingKeys
                    ? `Atualizar ${boletim.codigo}`
                    : `Gravar ${boletim.codigo} no Supabase`}
              </button>
            </div>
          </form>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <h3 className="text-sm font-bold text-slate-800">
                Últimos registros gravados em {boletim.codigo} ({rows.length})
              </h3>
              <button
                type="button"
                onClick={() => fetchRows(boletim.id)}
                className="text-xs font-semibold text-violet-600 hover:underline"
              >
                Atualizar lista
              </button>
            </div>
            {loading ? (
              <p className="p-5 text-sm text-slate-500">Carregando registros do Supabase...</p>
            ) : rows.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">Nenhum registro encontrado nesta tabela.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      {boletim.fields.slice(0, 6).map((f) => (
                        <th key={f.name} className="px-3 py-2 font-bold">
                          {f.label}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-right font-bold">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        {boletim.fields.slice(0, 6).map((f) => (
                          <td key={f.name} className="px-3 py-2 text-slate-800">
                            {row[f.name] !== null && row[f.name] !== undefined
                              ? String(row[f.name])
                              : '—'}
                          </td>
                        ))}
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleEdit(row)}
                            className="mr-2 font-semibold text-violet-600 hover:underline"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(row)}
                            className="font-semibold text-rose-600 hover:underline"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
