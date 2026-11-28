'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpDown,
  Minus,
  Plus,
  RotateCcw,
  Sparkles,
  TrendingDown,
} from 'lucide-react';
import {
  PERT_DISCIPLINA_LABEL,
  formatCurrencyBRL,
  type PertAtividadeCalculada,
  type PertCpmNetworkResult,
} from '../../data/pertCpmData';
import type { IslandId } from '../../data/mapa3dData';
import { cn } from '../../lib/utils';

export interface CrashingMetrics {
  diasComprimidosPrazo: number;
  totalDiasReduzidosTarefas: number;
  custoAdicional: number;
  economiaAtraso: number;
  saldoLiquido: number;
  novasCriticas: PertAtividadeCalculada[];
  hasInefficientCompression: boolean;
}

export function computeCrashingMetrics(
  baseline: PertCpmNetworkResult,
  simulated: PertCpmNetworkResult,
  delayCostPerDay: number
): CrashingMetrics {
  const baselineCriticalIds = new Set(
    baseline.atividades.filter((a) => a.e_critica).map((a) => a.id_atividade)
  );

  const diasComprimidosPrazo = Math.max(
    0,
    baseline.prazo_total_du - simulated.prazo_total_du
  );
  const totalDiasReduzidosTarefas = simulated.atividades.reduce(
    (acc, a) => acc + a.reducao_aplicada_du,
    0
  );
  const custoAdicional = simulated.atividades.reduce(
    (acc, a) => acc + a.reducao_aplicada_du * a.cost_slope,
    0
  );
  const economiaAtraso = diasComprimidosPrazo * delayCostPerDay;
  const saldoLiquido = economiaAtraso - custoAdicional;

  const novasCriticas = simulated.atividades.filter(
    (a) => a.e_critica && !baselineCriticalIds.has(a.id_atividade)
  );

  const hasInefficientCompression =
    totalDiasReduzidosTarefas > 0 &&
    totalDiasReduzidosTarefas > diasComprimidosPrazo;

  return {
    diasComprimidosPrazo,
    totalDiasReduzidosTarefas,
    custoAdicional,
    economiaAtraso,
    saldoLiquido,
    novasCriticas,
    hasInefficientCompression,
  };
}

interface CrashingKpiStripProps {
  baseline: PertCpmNetworkResult;
  simulated: PertCpmNetworkResult;
  delayCostPerDay: number;
  onChangeDelayCost: (value: number) => void;
}

export function CrashingKpiStrip({
  baseline,
  simulated,
  delayCostPerDay,
  onChangeDelayCost,
}: CrashingKpiStripProps) {
  const metrics = useMemo(
    () => computeCrashingMetrics(baseline, simulated, delayCostPerDay),
    [baseline, simulated, delayCostPerDay]
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* KPI 1: Dias Comprimidos */}
      <article className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)] transition-colors hover:border-[var(--border-strong)]">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            Dias Comprimidos
          </span>
          <span
            className={cn(
              'inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums whitespace-nowrap',
              metrics.diasComprimidosPrazo > 0
                ? 'bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]'
                : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
            )}
          >
            Nova duração: {simulated.prazo_total_du} du
          </span>
        </div>
        <div className="mt-3 font-mono text-[28px] sm:text-[30px] font-bold tracking-tight text-[var(--text-primary)] tabular-nums leading-none">
          -{metrics.diasComprimidosPrazo} du
        </div>
        <p className="mt-3 text-xs text-[var(--text-muted)] leading-relaxed">
          Baseline: {baseline.prazo_total_du} du · {simulated.total_criticas}{' '}
          atividades críticas
        </p>
      </article>

      {/* KPI 2: Custo Adicional (Crash) */}
      <article className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)] transition-colors hover:border-[var(--border-strong)]">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            Custo Adicional (Crash)
          </span>
          <span className="inline-flex items-center rounded-md bg-[var(--brand-gold-soft)] px-2 py-0.5 font-mono text-[11px] font-semibold text-[var(--brand-gold)] tabular-nums whitespace-nowrap">
            {metrics.totalDiasReduzidosTarefas} du alocados
          </span>
        </div>
        <div className="mt-3 font-mono text-[28px] sm:text-[30px] font-bold tracking-tight text-[var(--text-primary)] tabular-nums leading-none">
          {formatCurrencyBRL(metrics.custoAdicional)}
        </div>
        <p className="mt-3 text-xs text-[var(--text-muted)] leading-relaxed">
          Soma de redução aplicada × Cost Slope
        </p>
      </article>

      {/* KPI 3: Economia em Atraso + campo numérico discreto para Custo/du */}
      <article className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)] transition-colors hover:border-[var(--border-strong)]">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            Economia em Atraso
          </span>
          <span className="inline-flex items-center rounded-md bg-[var(--status-positive-soft)] px-2 py-0.5 font-mono text-[11px] font-semibold text-[var(--status-positive)] tabular-nums whitespace-nowrap">
            {metrics.diasComprimidosPrazo} du salvos
          </span>
        </div>
        <div className="mt-3 font-mono text-[28px] sm:text-[30px] font-bold tracking-tight text-[var(--text-primary)] tabular-nums leading-none">
          {formatCurrencyBRL(metrics.economiaAtraso)}
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1">
          <label
            htmlFor="crash-delay-cost-input"
            className="text-[11px] text-[var(--text-muted)] whitespace-nowrap"
          >
            Custo atraso/du:
          </label>
          <div className="flex items-center gap-1">
            <span className="font-mono text-[11px] text-[var(--text-muted)]">
              R$
            </span>
            <input
              id="crash-delay-cost-input"
              type="number"
              min={0}
              max={500000}
              step={500}
              value={delayCostPerDay}
              onChange={(e) => {
                const val = Number(e.target.value);
                onChangeDelayCost(Number.isNaN(val) ? 0 : val);
              }}
              className="w-20 bg-transparent text-right font-mono text-xs font-semibold text-[var(--text-primary)] tabular-nums outline-none"
            />
          </div>
        </div>
      </article>

      {/* KPI 4: Saldo Líquido da Compressão */}
      <article className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)] transition-colors hover:border-[var(--border-strong)]">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            Saldo Líquido da Compressão
          </span>
          <span
            className={cn(
              'inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold whitespace-nowrap',
              metrics.saldoLiquido >= 0
                ? 'bg-[var(--status-positive-soft)] text-[var(--status-positive)]'
                : 'bg-[var(--status-critical-soft)] text-[var(--status-critical)]'
            )}
          >
            {metrics.saldoLiquido > 0
              ? 'Vantajoso'
              : metrics.saldoLiquido === 0
                ? 'Neutro'
                : 'Custo excedente'}
          </span>
        </div>
        <div
          className={cn(
            'mt-3 font-mono text-[28px] sm:text-[30px] font-bold tracking-tight tabular-nums leading-none',
            metrics.saldoLiquido >= 0
              ? 'text-[var(--status-positive)]'
              : 'text-[var(--status-critical)]'
          )}
        >
          {metrics.saldoLiquido > 0 ? '+' : ''}
          {formatCurrencyBRL(metrics.saldoLiquido)}
        </div>
        <p className="mt-3 text-xs text-[var(--text-muted)] leading-relaxed">
          Economia em atraso − Custo adicional
        </p>
      </article>
    </div>
  );
}

interface CrashingViewProps {
  baseline: PertCpmNetworkResult;
  simulated: PertCpmNetworkResult;
  crashReductions: Record<string, number>;
  delayCostPerDay: number;
  frontFilter: 'todas' | IslandId;
  onAdjustReduction: (atividadeId: string, delta: number) => void;
  onResetSimulation: () => void;
}

export function CrashingView({
  baseline,
  simulated,
  crashReductions,
  delayCostPerDay,
  frontFilter,
  onAdjustReduction,
  onResetSimulation,
}: CrashingViewProps) {
  const [prioritizeCritical, setPrioritizeCritical] = useState(true);

  const baselineCriticalIds = useMemo(
    () =>
      new Set(
        baseline.atividades
          .filter((a) => a.e_critica)
          .map((a) => a.id_atividade)
      ),
    [baseline]
  );

  const metrics = useMemo(
    () => computeCrashingMetrics(baseline, simulated, delayCostPerDay),
    [baseline, simulated, delayCostPerDay]
  );

  // Atividades elegíveis (max_reducao_du > 0), filtradas por frente e ordenadas por menor Cost Slope
  const crashableRows = useMemo(() => {
    return simulated.atividades
      .filter((a) => {
        if (a.max_reducao_du <= 0) return false;
        return frontFilter === 'todas' || a.disciplina === frontFilter;
      })
      .sort((a, b) => {
        if (prioritizeCritical && a.e_critica !== b.e_critica) {
          return a.e_critica ? -1 : 1;
        }
        if (a.cost_slope !== b.cost_slope) {
          return a.cost_slope - b.cost_slope;
        }
        return a.id_atividade.localeCompare(b.id_atividade);
      });
  }, [simulated.atividades, frontFilter, prioritizeCritical]);

  const hasAnyReduction = Object.keys(crashReductions).length > 0;

  return (
    <div className="space-y-5">
      {/* Alertas contextuais dinâmicos de mudança no caminho crítico */}
      {(metrics.novasCriticas.length > 0 ||
        metrics.hasInefficientCompression) && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {metrics.novasCriticas.length > 0 && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-[var(--brand-gold)]/40 bg-[var(--brand-gold-soft)]/50 px-4 py-3 text-xs text-[var(--text-primary)]">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-gold)]" />
              <div>
                <p className="font-semibold">
                  Novo caminho crítico paralelo ativado
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                  A compressão zerou a folga de{' '}
                  <span className="font-mono font-semibold text-[var(--text-primary)]">
                    {metrics.novasCriticas.map((a) => a.id_atividade).join(', ')}
                  </span>
                  . Para continuar reduzindo o prazo final, comprima as frentes
                  críticas em paralelo.
                </p>
              </div>
            </div>
          )}

          {metrics.hasInefficientCompression && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-[var(--status-critical)]/35 bg-[var(--status-critical-soft)]/45 px-4 py-3 text-xs text-[var(--text-primary)]">
              <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-critical)]" />
              <div>
                <p className="font-semibold">
                  Compressão excedente fora do gargalo crítico
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                  Foram comprimidos{' '}
                  <span className="font-mono font-semibold">
                    {metrics.totalDiasReduzidosTarefas} du
                  </span>{' '}
                  em tarefas, mas o prazo total da rede reduziu{' '}
                  <span className="font-mono font-semibold">
                    {metrics.diasComprimidosPrazo} du
                  </span>
                  . Priorize atividades críticas para maximizar o saldo líquido.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Card principal — Simulador de Crashing (Ordenado por Menor Cost Slope) */}
      <section
        aria-label="Simulador de Crashing"
        className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)]"
      >
        <div className="flex flex-col gap-3 border-b border-[var(--border-subtle)] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-[var(--font-display)] text-sm sm:text-base font-semibold text-[var(--text-primary)]">
              Simulador de Crashing (Ordenado por Menor Cost Slope)
            </h2>
            <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
              Comprima atividades críticas de menor custo marginal por dia útil
              (Cost Slope) e acompanhe o recálculo em tempo real da rede
              PERT/CPM
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPrioritizeCritical((prev) => !prev)}
              aria-pressed={prioritizeCritical}
              className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-colors cursor-pointer',
                prioritizeCritical
                  ? 'border-[var(--border-brand)] bg-[var(--brand-primary-soft)] font-semibold text-[var(--brand-primary)]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              {prioritizeCritical
                ? 'Críticas priorizadas'
                : 'Ordenado só por Slope'}
            </button>

            <button
              type="button"
              onClick={onResetSimulation}
              disabled={!hasAnyReduction}
              className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors',
                hasAnyReduction
                  ? 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:border-[var(--border-strong)] cursor-pointer'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 text-[var(--text-muted)] opacity-55 cursor-not-allowed'
              )}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Zerar simulação
            </button>
          </div>
        </div>

        {crashableRows.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--text-secondary)]">
            Nenhuma atividade compressível encontrada para a frente selecionada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/70 font-mono text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
                  <th className="px-5 py-3">Atividade</th>
                  <th className="px-3 py-3 text-right">Normal (du)</th>
                  <th className="px-3 py-3 text-right">Limite Crash (du)</th>
                  <th className="px-4 py-3 text-right">Custo Normal</th>
                  <th className="px-4 py-3 text-right">Cost Slope (R$/du)</th>
                  <th className="px-5 py-3 text-right">Comprimir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-xs">
                {crashableRows.map((item) => {
                  const red = item.reducao_aplicada_du;
                  const maxRed = item.max_reducao_du;
                  const isNewlyCritical =
                    item.e_critica &&
                    !baselineCriticalIds.has(item.id_atividade);
                  const slopeBelowDelayCost = item.cost_slope <= delayCostPerDay;

                  return (
                    <tr
                      key={item.id_atividade}
                      className={cn(
                        'transition-colors',
                        red > 0
                          ? 'bg-[var(--brand-primary-soft)]/30 hover:bg-[var(--brand-primary-soft)]/40'
                          : item.e_critica
                            ? 'border-l-2 border-l-[var(--status-critical)] bg-[var(--status-critical-soft)]/12 hover:bg-[var(--status-critical-soft)]/20'
                            : 'hover:bg-[var(--bg-elevated)]/60'
                      )}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[var(--text-secondary)]">
                            {item.id_atividade}
                          </span>
                          <span className="font-semibold text-[var(--text-primary)]">
                            {item.nome_atividade}
                          </span>
                          {item.e_critica && (
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase',
                                isNewlyCritical
                                  ? 'border-[var(--brand-gold)]/50 bg-[var(--brand-gold-soft)] text-[var(--brand-gold)]'
                                  : 'border-[var(--status-critical)]/40 bg-[var(--status-critical-soft)] text-[var(--status-critical)]'
                              )}
                            >
                              <AlertTriangle className="h-2.5 w-2.5" />
                              {isNewlyCritical ? 'Crítica · Nova' : 'Crítica'}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                          {PERT_DISCIPLINA_LABEL[item.disciplina]} · Folga
                          atual:{' '}
                          <span className="font-mono font-medium text-[var(--text-secondary)]">
                            {item.ft} du
                          </span>
                          {red > 0 && (
                            <span className="ml-2 font-mono font-semibold text-[var(--brand-primary)]">
                              + {formatCurrencyBRL(red * item.cost_slope)}
                            </span>
                          )}
                        </p>
                      </td>

                      <td className="px-3 py-3.5 text-right font-mono tabular-nums">
                        {red > 0 ? (
                          <div className="inline-flex items-center gap-1">
                            <span className="text-[var(--text-muted)] line-through">
                              {item.duracao_normal_du}
                            </span>
                            <span className="font-bold text-[var(--brand-primary)]">
                              → {item.duracao_du}
                            </span>
                          </div>
                        ) : (
                          <span className="font-semibold text-[var(--text-primary)]">
                            {item.duracao_normal_du}
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-3.5 text-right font-mono text-[var(--text-secondary)] tabular-nums">
                        {item.duracao_crash_du}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono text-[var(--text-secondary)] tabular-nums">
                        {formatCurrencyBRL(item.custo_normal)}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono tabular-nums">
                        <span
                          className={cn(
                            'font-semibold',
                            slopeBelowDelayCost
                              ? 'text-[var(--status-positive)]'
                              : 'text-[var(--brand-gold)]'
                          )}
                        >
                          {formatCurrencyBRL(item.cost_slope)}/du
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-1">
                          <button
                            type="button"
                            onClick={() =>
                              onAdjustReduction(item.id_atividade, -1)
                            }
                            disabled={red <= 0}
                            aria-label={`Remover 1 dia de compressão de ${item.nome_atividade}`}
                            className={cn(
                              'inline-flex h-6 w-6 items-center justify-center rounded-lg border transition-colors',
                              red > 0
                                ? 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--border-strong)] cursor-pointer'
                                : 'border-transparent text-[var(--text-muted)] opacity-40 cursor-not-allowed'
                            )}
                          >
                            <Minus className="h-3 w-3" />
                          </button>

                          <span
                            className={cn(
                              'min-w-[54px] text-center font-mono text-[11px] font-bold tabular-nums',
                              red > 0
                                ? 'text-[var(--brand-primary)]'
                                : 'text-[var(--text-secondary)]'
                            )}
                          >
                            -{red} / {maxRed}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              onAdjustReduction(item.id_atividade, 1)
                            }
                            disabled={red >= maxRed}
                            aria-label={`Comprimir 1 dia de ${item.nome_atividade}`}
                            className={cn(
                              'inline-flex h-6 w-6 items-center justify-center rounded-lg border transition-colors',
                              red < maxRed
                                ? 'border-[var(--border-brand)] bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] cursor-pointer'
                                : 'border-transparent text-[var(--text-muted)] opacity-40 cursor-not-allowed'
                            )}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
