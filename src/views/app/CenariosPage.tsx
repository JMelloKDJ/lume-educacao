'use client';

import { useMemo } from 'react';
import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Check, RotateCcw, Sparkles } from 'lucide-react';
import { useTheme } from '../../components/theme-provider';
import type { ScenarioItem } from '../../data/workspaceData';
import { cn } from '../../lib/utils';
import { useLumeStore } from '../../services/lumeStore';

interface CenariosPageProps {
  onApproveScenario: (scenario: ScenarioItem) => void;
}

interface ScatterScenarioPoint extends ScenarioItem {
  plotX: number;
  plotY: number;
  displayRetorno: string;
  isSimulated?: boolean;
}

const STATUS_BADGE_STYLES: Record<ScenarioItem['statusTone'], string> = {
  muted:
    'bg-slate-500/15 text-[var(--text-secondary)] border border-[var(--border-subtle)]',
  positive: 'bg-[var(--status-positive-soft)] text-[var(--status-positive)]',
  info: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  gold: 'bg-[var(--brand-gold-soft)] text-[var(--brand-gold)]',
};

const TIMELINE_TICK_LABELS: Record<number, string> = {
  1: 'Fev 27',
  2: 'Mar 27',
  3: 'Abr 27',
  4: 'Jun 27',
};

function ScatterScenarioTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: ScatterScenarioPoint }>;
}) {
  if (!active || !payload || !payload[0]?.payload) return null;
  const sc = payload[0].payload;
  return (
    <div className="rounded-xl border border-[var(--status-positive)]/50 bg-[var(--bg-elevated)] px-3.5 py-2.5 shadow-[var(--shadow-popover)]">
      <p className="text-xs font-semibold text-[var(--text-primary)]">
        {sc.name}
        {sc.isSimulated ? ' · Simulado' : ''}
      </p>
      <p className="mt-0.5 font-mono text-[11px] font-medium text-[var(--status-positive)] tabular-nums">
        Retorno {sc.displayRetorno} · {sc.prazoFinal}
      </p>
    </div>
  );
}

interface AssumptionSliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
}

function AssumptionSlider({
  id,
  label,
  value,
  min,
  max,
  onChange,
}: AssumptionSliderProps) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <label htmlFor={id} className="font-medium text-[var(--text-primary)]">
          {label}
        </label>
        <span className="font-mono text-xs font-semibold text-[var(--text-secondary)] tabular-nums">
          {value}%
        </span>
      </div>

      <div className="relative mt-2.5 flex h-6 items-center">
        <div className="pointer-events-none h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
          <div
            className="h-full rounded-full bg-[var(--brand-primary)] transition-[width] duration-75"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--brand-primary)] bg-white shadow-sm"
          style={{ left: `${pct}%` }}
        />
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          aria-label={label}
          aria-valuenow={value}
          aria-valuetext={`${value}%`}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
        />
      </div>
    </div>
  );
}

export function CenariosPage({ onApproveScenario }: CenariosPageProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const {
    scenarios,
    selectedScenarioId,
    approvedScenarioId,
    simulatorPremises,
    activeSimulation,
    selectScenario,
    approveScenario,
    updateSimulatorPremises,
    resetSimulatorPremises,
  } = useLumeStore();

  const selectedScenario =
    scenarios.find((s) => s.id === selectedScenarioId) ?? scenarios[1];

  const isApproved = approvedScenarioId === selectedScenario.id;

  const scatterPoints = useMemo<ScatterScenarioPoint[]>(() => {
    return scenarios.map((sc) => {
      if (sc.id === selectedScenario.id) {
        return {
          ...sc,
          plotX: activeSimulation.simulatedTimelineIndex,
          plotY: activeSimulation.projected,
          displayRetorno: activeSimulation.projectedLabel,
          isSimulated: activeSimulation.isModified,
        };
      }
      return {
        ...sc,
        plotX: sc.timelineIndex,
        plotY: sc.retornoNum,
        displayRetorno: sc.retornoLabel,
        isSimulated: false,
      };
    });
  }, [scenarios, selectedScenario.id, activeSimulation]);

  const yDomainMax = useMemo(() => {
    const highest = Math.max(
      20,
      ...scatterPoints.map((pt) => Math.ceil(pt.plotY + 2))
    );
    return highest > 22 ? Math.ceil(highest / 4) * 4 : 22;
  }, [scatterPoints]);

  const yTicks = useMemo(() => {
    if (yDomainMax <= 22) return [0, 8, 14, 20];
    return [0, 8, 16, 24, yDomainMax].filter(
      (v, idx, arr) => v <= yDomainMax && arr.indexOf(v) === idx
    );
  }, [yDomainMax]);

  const gridColor = isDark
    ? 'rgba(148, 163, 184, 0.13)'
    : 'rgba(15, 23, 42, 0.08)';
  const axisColor = '#64748B';
  const brandColor = isDark ? '#7C5CFC' : '#6747E6';

  const handleApprove = async () => {
    const approved = await approveScenario(selectedScenario.id);
    onApproveScenario(approved);
  };

  const statusTextColor =
    activeSimulation.status === 'Viável'
      ? 'text-[var(--status-positive)]'
      : activeSimulation.status === 'Atenção'
        ? 'text-[var(--brand-gold)]'
        : 'text-[var(--status-critical)]';

  const simulatedPointColor =
    activeSimulation.status === 'Crítico'
      ? isDark
        ? '#F87171'
        : '#E11D48'
      : activeSimulation.status === 'Atenção'
        ? isDark
          ? '#F59E0B'
          : '#D97706'
        : selectedScenario.pointColor;

  return (
    <div className="space-y-5">
      {/* Top Highlighted Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-[var(--border-brand)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-[var(--shadow-card)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 h-56 w-72 rounded-full opacity-15 dark:opacity-25 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, var(--brand-primary) 0%, transparent 72%)',
          }}
        />

        <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-xl min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary-soft)] px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--brand-primary)]">
              <Sparkles className="h-3 w-3" />
              {isApproved
                ? 'Cenário Aprovado'
                : selectedScenario.recommended
                  ? 'Cenário Recomendado'
                  : 'Cenário em Análise'}
            </span>
            <h2 className="mt-2.5 font-[var(--font-display)] text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              {selectedScenario.name}
            </h2>
            <p className="mt-1 text-xs sm:text-[13px] text-[var(--text-secondary)] leading-relaxed">
              {selectedScenario.summary}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-2.5 min-w-[92px]">
              <p className="text-[11px] text-[var(--text-muted)]">Prazo</p>
              <p className="mt-0.5 font-mono text-sm font-bold text-[var(--text-primary)] tabular-nums">
                {selectedScenario.prazoDelta}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-2.5 min-w-[106px]">
              <p className="text-[11px] text-[var(--text-muted)]">
                {activeSimulation.isModified ? 'Retorno Sim.' : 'Retorno Est.'}
              </p>
              <p
                className={cn(
                  'mt-0.5 font-mono text-sm font-bold tabular-nums',
                  activeSimulation.isModified
                    ? statusTextColor
                    : 'text-[var(--text-primary)]'
                )}
              >
                {activeSimulation.projectedLabel}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-2.5 min-w-[84px]">
              <p className="text-[11px] text-[var(--text-muted)]">Risco</p>
              <p className="mt-0.5 font-mono text-sm font-bold text-[var(--text-primary)]">
                {activeSimulation.isModified && activeSimulation.status === 'Crítico'
                  ? 'Alto'
                  : selectedScenario.risco}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void handleApprove()}
              className={cn(
                'inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/50',
                isApproved
                  ? 'bg-[var(--status-positive)] text-slate-950 hover:opacity-95'
                  : 'bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)]'
              )}
            >
              <Check className="h-4 w-4" />
              <span>{isApproved ? 'Cenário aprovado' : 'Aprovar cenário'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Comparativo de Cenários — Clickable Rounded Rows */}
      <section className="min-w-0 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-[var(--shadow-card)]">
        <h3 className="font-[var(--font-display)] text-base sm:text-[17px] font-semibold text-[var(--text-primary)] tracking-tight">
          Comparativo de Cenários
        </h3>

        <div className="mt-5 -mx-1 overflow-x-auto px-1 pb-1">
          <div className="min-w-[620px]">
            {/* Table Column Headers */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-4 pb-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
              <span>Cenário</span>
              <span>Prazo Final</span>
              <span>Investimento</span>
              <span>Retorno Est.</span>
              <span>Status</span>
            </div>

            {/* Rounded Clickable Rows */}
            <div className="space-y-2.5">
              {scenarios.map((sc) => {
                const isSelected = sc.id === selectedScenarioId;
                const rowApproved = approvedScenarioId === sc.id;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => selectScenario(sc.id)}
                    aria-pressed={isSelected}
                    className={cn(
                      'grid w-full grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/40',
                      isSelected
                        ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-soft)]/55 dark:bg-[var(--brand-primary-soft)]/45 shadow-xs'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]/65 hover:border-[var(--border-strong)] hover:bg-[var(--bg-elevated)]'
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs sm:text-[13px] font-semibold text-[var(--text-primary)]">
                        {sc.name}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-[var(--text-muted)]">
                        {sc.subtitle}
                      </p>
                    </div>

                    <span className="font-mono text-xs font-medium text-[var(--text-primary)] tabular-nums">
                      {sc.prazoFinal}
                    </span>

                    <span className="font-mono text-xs font-medium text-[var(--text-secondary)] tabular-nums">
                      {sc.investimento}
                    </span>

                    <span
                      className={cn(
                        'font-mono text-xs font-bold tabular-nums',
                        sc.recommended || rowApproved
                          ? 'text-[var(--status-positive)]'
                          : 'text-[var(--text-primary)]'
                      )}
                    >
                      {isSelected && activeSimulation.isModified
                        ? activeSimulation.projectedLabel
                        : sc.retornoLabel}
                    </span>

                    <div>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap',
                          rowApproved
                            ? STATUS_BADGE_STYLES.positive
                            : STATUS_BADGE_STYLES[sc.statusTone]
                        )}
                      >
                        {rowApproved ? 'Aprovado' : sc.statusLabel}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Row: ScatterChart Retorno × Prazo + Simulador de Premissas */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Left: Retorno × Prazo ScatterChart */}
        <section className="min-w-0 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-[var(--font-display)] text-base sm:text-[17px] font-semibold text-[var(--text-primary)] tracking-tight">
                Retorno × Prazo
              </h3>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                Posicionamento comparativo das alternativas
              </p>
            </div>

            {activeSimulation.isModified && (
              <span className="rounded-full border border-[var(--border-brand)] bg-[var(--brand-primary-soft)] px-2.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--brand-primary)]">
                Ponto simulado ativo
              </span>
            )}
          </div>

          <div className="mt-5 h-[256px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 24, left: -12, bottom: 10 }}>
                <CartesianGrid
                  stroke={gridColor}
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  type="number"
                  dataKey="plotX"
                  domain={[0.5, 4.5]}
                  ticks={[1, 2, 3, 4]}
                  axisLine={{ stroke: gridColor }}
                  tickLine={false}
                  dy={8}
                  tickFormatter={(v: number) => TIMELINE_TICK_LABELS[v] ?? ''}
                  tick={{
                    fill: axisColor,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11,
                  }}
                />

                <YAxis
                  type="number"
                  dataKey="plotY"
                  domain={[0, yDomainMax]}
                  ticks={yTicks}
                  axisLine={{ stroke: gridColor }}
                  tickLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                  tick={{
                    fill: axisColor,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11,
                  }}
                />

                <ReferenceLine
                  x={activeSimulation.simulatedTimelineIndex}
                  stroke={brandColor}
                  strokeOpacity={0.35}
                  strokeDasharray="3 3"
                />

                {activeSimulation.isModified && (
                  <ReferenceLine
                    y={activeSimulation.projected}
                    stroke={simulatedPointColor}
                    strokeOpacity={0.3}
                    strokeDasharray="3 3"
                  />
                )}

                <Tooltip
                  cursor={{ strokeDasharray: '3 3', stroke: gridColor }}
                  content={<ScatterScenarioTooltip />}
                />

                <Scatter
                  data={scatterPoints}
                  isAnimationActive={false}
                  onClick={(entry) => {
                    const sc = entry?.payload as ScatterScenarioPoint | undefined;
                    if (sc?.id) selectScenario(sc.id);
                  }}
                  shape={(props: {
                    cx?: number;
                    cy?: number;
                    payload?: ScatterScenarioPoint;
                  }) => {
                    const { cx, cy, payload } = props;
                    if (cx === undefined || cy === undefined || !payload) {
                      return <g />;
                    }
                    const isSelected = payload.id === selectedScenarioId;
                    const dotFill = isSelected
                      ? simulatedPointColor
                      : payload.pointColor;
                    return (
                      <g className="cursor-pointer">
                        {isSelected && (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={14}
                            fill={dotFill}
                            fillOpacity={0.22}
                          />
                        )}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isSelected ? 7.5 : 6}
                          fill={dotFill}
                          stroke={isSelected ? (isDark ? '#F8FAFC' : '#FFFFFF') : 'none'}
                          strokeWidth={isSelected ? 2 : 0}
                        />
                        <text
                          x={cx}
                          y={cy + 21}
                          textAnchor="middle"
                          fill={isSelected ? (isDark ? '#F8FAFC' : '#0F172A') : axisColor}
                          fontFamily="Inter, sans-serif"
                          fontSize={11}
                          fontWeight={isSelected ? 600 : 400}
                        >
                          {payload.shortLabel}
                        </text>
                      </g>
                    );
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Right: Simulador de Premissas */}
        <section className="flex min-w-0 flex-col justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-[var(--shadow-card)]">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-[var(--font-display)] text-base sm:text-[17px] font-semibold text-[var(--text-primary)] tracking-tight">
                  Simulador de Premissas
                </h3>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  Ajuste os parâmetros para testar sensibilidade
                </p>
              </div>

              {activeSimulation.isModified && (
                <button
                  type="button"
                  onClick={resetSimulatorPremises}
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] cursor-pointer shrink-0"
                >
                  <RotateCcw className="h-3 w-3" />
                  Restaurar
                </button>
              )}
            </div>

            <div className="mt-6 space-y-5">
              <AssumptionSlider
                id="slider-adocao"
                label="Adoção nas escolas"
                value={simulatorPremises.adocao}
                min={40}
                max={100}
                onChange={(val) => updateSimulatorPremises({ adocao: val })}
              />
              <AssumptionSlider
                id="slider-capacidade"
                label="Capacidade da equipe"
                value={simulatorPremises.capacidade}
                min={50}
                max={100}
                onChange={(val) => updateSimulatorPremises({ capacidade: val })}
              />
              <AssumptionSlider
                id="slider-reserva"
                label="Reserva de segurança"
                value={simulatorPremises.reserva}
                min={5}
                max={30}
                onChange={(val) => updateSimulatorPremises({ reserva: val })}
              />
            </div>
          </div>

          {/* Live Projected Outcome Box */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3.5">
            <span className="text-xs text-[var(--text-secondary)]">
              Retorno projetado com estes ajustes
            </span>
            <span
              className={cn(
                'font-mono text-sm font-bold tabular-nums',
                statusTextColor
              )}
            >
              {activeSimulation.projectedLabel} · {activeSimulation.status}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
