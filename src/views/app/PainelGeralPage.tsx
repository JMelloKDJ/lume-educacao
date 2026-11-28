'use client';

import { useState } from 'react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowUpRight, CheckCircle2, Clock, User } from 'lucide-react';
import type { NavSectionId } from '../../components/layout/sidebar';
import { useTheme } from '../../components/theme-provider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { KpiCard } from '../../components/ui/kpi-card';
import type { RadarAttentionItem } from '../../data/workspaceData';
import { cn } from '../../lib/utils';
import { useLumeStore } from '../../services/lumeStore';

interface PainelGeralPageProps {
  onSelectSection: (section: NavSectionId) => void;
}

function formatPtPercent(val: number): string {
  return `${val.toFixed(1).replace('.', ',')}%`;
}

function CurvaSTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload?: {
      month: string;
      fullMonth: string;
      realizado: number | null;
      planejado: number;
    };
  }>;
}) {
  if (!active || !payload || !payload[0]?.payload) return null;
  const pt = payload[0].payload;
  return (
    <div className="rounded-xl border border-[var(--border-brand)] bg-[var(--bg-elevated)] px-3.5 py-2.5 shadow-[var(--shadow-popover)]">
      <p className="font-mono text-xs font-semibold text-[var(--text-primary)] tabular-nums">
        {pt.month}
        {pt.realizado !== null
          ? ` · Realizado ${formatPtPercent(pt.realizado)}`
          : ' · Projeção'}
      </p>
      <p className="mt-1 font-mono text-[11px] text-[var(--text-secondary)] tabular-nums">
        Planejado: {formatPtPercent(pt.planejado)}
      </p>
    </div>
  );
}

function EtapasTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload?: { etapa: string; realizado: number; planejado: number };
  }>;
}) {
  if (!active || !payload || !payload[0]?.payload) return null;
  const pt = payload[0].payload;
  return (
    <div className="rounded-xl border border-[var(--border-brand)] bg-[var(--bg-elevated)] px-3.5 py-2.5 shadow-[var(--shadow-popover)]">
      <p className="text-xs font-semibold text-[var(--text-primary)]">{pt.etapa}</p>
      <p className="mt-1 font-mono text-[11px] text-[var(--brand-primary)] tabular-nums">
        Realizado: {pt.realizado}%
      </p>
      <p className="font-mono text-[11px] text-[var(--brand-gold)] tabular-nums">
        Planejado: {pt.planejado}%
      </p>
    </div>
  );
}

function DeliveryTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload?: { ciclo: string; meta: number; entregue: number; tendencia: number };
  }>;
}) {
  if (!active || !payload || !payload[0]?.payload) return null;
  const pt = payload[0].payload;
  return (
    <div className="rounded-xl border border-[var(--border-brand)] bg-[var(--bg-elevated)] px-3.5 py-2.5 shadow-[var(--shadow-popover)]">
      <p className="font-mono text-xs font-semibold text-[var(--text-primary)]">
        Ciclo {pt.ciclo}
      </p>
      <div className="mt-1 space-y-0.5 font-mono text-[11px] tabular-nums">
        <p className="text-[var(--brand-primary)]">Entregue: {pt.entregue} pts</p>
        <p className="text-sky-500 dark:text-sky-400">Meta: {pt.meta} pts</p>
      </div>
    </div>
  );
}

function BudgetTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload?: { month: string; valorK: number; isForecast?: boolean };
  }>;
}) {
  if (!active || !payload || !payload[0]?.payload) return null;
  const pt = payload[0].payload;
  return (
    <div className="rounded-xl border border-[var(--border-brand)] bg-[var(--bg-elevated)] px-3 py-2 shadow-[var(--shadow-popover)]">
      <p className="font-mono text-xs font-semibold text-[var(--text-primary)]">
        {pt.month} {pt.isForecast ? '(Previsto)' : ''}
      </p>
      <p className="mt-0.5 font-mono text-[11px] text-[var(--brand-primary)] tabular-nums">
        R$ {pt.valorK}k
      </p>
    </div>
  );
}

const RADAR_TONE_DOT: Record<RadarAttentionItem['tone'], string> = {
  gold: 'bg-[var(--brand-gold)]',
  positive: 'bg-[var(--status-positive)]',
  neutral: 'bg-[var(--brand-primary)]',
  critical: 'bg-[var(--status-critical)]',
};

const RADAR_TONE_BADGE: Record<RadarAttentionItem['tone'], string> = {
  gold: 'bg-[var(--brand-gold-soft)] text-[var(--brand-gold)]',
  positive: 'bg-[var(--status-positive-soft)] text-[var(--status-positive)]',
  neutral: 'bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]',
  critical: 'bg-[var(--status-critical-soft)] text-[var(--status-critical)]',
};

function resolveRadarTarget(item: RadarAttentionItem): {
  section: NavSectionId;
  ctaLabel: string;
} {
  if (item.targetSection === 'cenarios') {
    return { section: 'cenarios', ctaLabel: 'Abrir em Decisão & Cenários' };
  }
  if (item.targetSection === 'cronograma') {
    return { section: 'cronograma', ctaLabel: 'Ver no Cronograma' };
  }
  if (item.targetSection === 'riscos') {
    return { section: 'riscos', ctaLabel: 'Ver em Riscos & Metas' };
  }
  return { section: 'mapa3d', ctaLabel: 'Inspecionar no Mapa 3D' };
}

export function PainelGeralPage({ onSelectSection }: PainelGeralPageProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const { panel, mitigatedRadarIds, toggleRadarMitigated } = useLumeStore();

  const [chartMode, setChartMode] = useState<'curvaS' | 'etapas'>('curvaS');
  const [activeRadarItem, setActiveRadarItem] =
    useState<RadarAttentionItem | null>(null);

  const brandColor = isDark ? '#7C5CFC' : '#6747E6';
  const brandMutedBar = isDark ? '#6D54D8' : '#7C61EE';
  const goldColor = isDark ? '#D4AF37' : '#C69C2B';
  const skyColor = isDark ? '#38BDF8' : '#0284C7';
  const metaBarColor = isDark ? '#24587A' : '#38BDF8';
  const forecastBarColor = isDark ? '#256789' : '#0EA5E9';
  const positiveColor = isDark ? '#34D399' : '#10B981';
  const gridColor = isDark
    ? 'rgba(148, 163, 184, 0.12)'
    : 'rgba(15, 23, 42, 0.08)';
  const axisColor = '#64748B';
  const activeAxisColor = isDark ? '#F8FAFC' : '#0F172A';

  const activeRadarTarget = activeRadarItem
    ? resolveRadarTarget(activeRadarItem)
    : null;
  const activeRadarMitigated = activeRadarItem
    ? Boolean(mitigatedRadarIds[activeRadarItem.id])
    : false;

  return (
    <div className="space-y-5">
      {/* Row 1: 4 KPI Cards */}
      <section
        aria-label="Indicadores executivos do projeto"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {panel.kpis.map((kpi) => (
          <KpiCard
            key={kpi.id}
            title={kpi.title}
            value={kpi.value}
            badgeText={kpi.badgeText}
            badgeTone={kpi.badgeTone}
            insight={kpi.insight}
          />
        ))}
      </section>

      {/* Row 2: Avanço Físico × Financeiro + Fluxo de Entregas */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Chart 1: Avanço Físico × Financeiro */}
        <section className="min-w-0 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-[var(--font-display)] text-base sm:text-[17px] font-semibold text-[var(--text-primary)] tracking-tight">
                Avanço Físico × Financeiro
              </h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                {chartMode === 'curvaS'
                  ? 'Acumulado mensal em % do plano'
                  : 'Comparativo realizado × planejado por frente'}
              </p>
            </div>

            <div
              role="group"
              aria-label="Alternar modo de visualização"
              className="inline-flex items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-0.5 shrink-0"
            >
              <button
                type="button"
                onClick={() => setChartMode('curvaS')}
                aria-pressed={chartMode === 'curvaS'}
                className={cn(
                  'rounded-[9px] px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer',
                  chartMode === 'curvaS'
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                )}
              >
                Curva S
              </button>
              <button
                type="button"
                onClick={() => setChartMode('etapas')}
                aria-pressed={chartMode === 'etapas'}
                className={cn(
                  'rounded-[9px] px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer',
                  chartMode === 'etapas'
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                )}
              >
                Etapas
              </button>
            </div>
          </div>

          <div className="mt-5 h-[248px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === 'curvaS' ? (
                <ComposedChart
                  data={panel.curvaS}
                  margin={{ top: 10, right: 12, left: -14, bottom: 4 }}
                >
                  <defs>
                    <linearGradient id="painelCurvaSFill" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor={brandColor}
                        stopOpacity={isDark ? 0.34 : 0.22}
                      />
                      <stop offset="100%" stopColor={brandColor} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    stroke={gridColor}
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="month"
                    axisLine={{ stroke: gridColor }}
                    tickLine={false}
                    dy={8}
                    tick={(props) => {
                      const { x, y, payload } = props;
                      const isCurrent = payload?.value === panel.currentMonthShort;
                      return (
                        <text
                          x={x}
                          y={y}
                          dy={12}
                          textAnchor="middle"
                          fill={isCurrent ? activeAxisColor : axisColor}
                          fontFamily="JetBrains Mono, monospace"
                          fontSize={11}
                          fontWeight={isCurrent ? 700 : 400}
                        >
                          {payload?.value}
                        </text>
                      );
                    }}
                  />

                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
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
                    x={panel.currentMonthShort}
                    stroke={brandColor}
                    strokeOpacity={0.42}
                    strokeDasharray="3 3"
                  />

                  <Tooltip
                    cursor={{
                      stroke: brandColor,
                      strokeWidth: 1,
                      strokeOpacity: 0.3,
                    }}
                    content={<CurvaSTooltip />}
                  />

                  <Line
                    type="monotone"
                    dataKey="planejado"
                    stroke={goldColor}
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                    activeDot={{ r: 4, fill: goldColor, strokeWidth: 0 }}
                  />

                  <Area
                    type="monotone"
                    dataKey="realizado"
                    stroke={brandColor}
                    strokeWidth={2.5}
                    fill="url(#painelCurvaSFill)"
                    connectNulls={false}
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      if (
                        cx === undefined ||
                        cy === undefined ||
                        payload?.month !== panel.currentMonthShort ||
                        payload?.realizado === null
                      ) {
                        return <g key={`empty-${payload?.month}`} />;
                      }
                      return (
                        <g key={`dot-${payload.month}`}>
                          <circle
                            cx={cx}
                            cy={cy}
                            r={7}
                            fill={brandColor}
                            fillOpacity={0.22}
                          />
                          <circle
                            cx={cx}
                            cy={cy}
                            r={4.5}
                            fill={brandColor}
                            stroke={isDark ? '#F8FAFC' : '#FFFFFF'}
                            strokeWidth={2}
                          />
                        </g>
                      );
                    }}
                    activeDot={{
                      r: 5,
                      fill: brandColor,
                      stroke: isDark ? '#F8FAFC' : '#FFFFFF',
                      strokeWidth: 2,
                    }}
                  />
                </ComposedChart>
              ) : (
                <BarChart
                  data={panel.etapas}
                  margin={{ top: 10, right: 12, left: -14, bottom: 4 }}
                  barGap={6}
                >
                  <CartesianGrid
                    stroke={gridColor}
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="etapa"
                    axisLine={{ stroke: gridColor }}
                    tickLine={false}
                    dy={8}
                    tick={{
                      fill: axisColor,
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 11,
                    }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    axisLine={{ stroke: gridColor }}
                    tickLine={false}
                    tickFormatter={(v: number) => `${v}%`}
                    tick={{
                      fill: axisColor,
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 11,
                    }}
                  />
                  <Tooltip
                    cursor={{
                      fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)',
                    }}
                    content={<EtapasTooltip />}
                  />
                  <Bar
                    dataKey="planejado"
                    fill={goldColor}
                    fillOpacity={0.45}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={22}
                  />
                  <Bar
                    dataKey="realizado"
                    fill={brandColor}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={22}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </section>

        {/* Chart 2: Fluxo de Entregas (ComposedChart) */}
        <section className="min-w-0 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-[var(--font-display)] text-base sm:text-[17px] font-semibold text-[var(--text-primary)] tracking-tight">
                Fluxo de Entregas
              </h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                Pontos concluídos por ciclo quinzenal
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium text-[var(--text-secondary)]">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: brandColor }}
                />
                Entregue
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: skyColor }}
                />
                Meta
              </span>
            </div>
          </div>

          <div className="mt-5 h-[248px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={panel.fluxoEntregas}
                margin={{ top: 10, right: 12, left: -16, bottom: 4 }}
                barGap={3}
              >
                <CartesianGrid
                  stroke={gridColor}
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="ciclo"
                  axisLine={{ stroke: gridColor }}
                  tickLine={false}
                  dy={8}
                  tick={(props) => {
                    const { x, y, payload } = props;
                    const item = panel.fluxoEntregas.find(
                      (c) => c.ciclo === payload?.value
                    );
                    return (
                      <text
                        x={x}
                        y={y}
                        dy={12}
                        textAnchor="middle"
                        fill={item?.destaque ? activeAxisColor : axisColor}
                        fontFamily="JetBrains Mono, monospace"
                        fontSize={11}
                        fontWeight={item?.destaque ? 700 : 400}
                      >
                        {payload?.value}
                      </text>
                    );
                  }}
                />

                <YAxis
                  domain={[0, 60]}
                  ticks={[0, 15, 30, 45, 60]}
                  axisLine={{ stroke: gridColor }}
                  tickLine={false}
                  tick={{
                    fill: axisColor,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11,
                  }}
                />

                <Tooltip
                  cursor={{
                    fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)',
                  }}
                  content={<DeliveryTooltip />}
                />

                <Bar
                  dataKey="meta"
                  fill={metaBarColor}
                  radius={[5, 5, 0, 0]}
                  maxBarSize={14}
                />
                <Bar
                  dataKey="entregue"
                  fill={brandColor}
                  radius={[5, 5, 0, 0]}
                  maxBarSize={14}
                />
                <Line
                  type="monotone"
                  dataKey="tendencia"
                  stroke={goldColor}
                  strokeWidth={2}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    if (
                      cx === undefined ||
                      cy === undefined ||
                      !payload?.destaque
                    ) {
                      return <g key={`trend-empty-${payload?.ciclo}`} />;
                    }
                    return (
                      <circle
                        key={`trend-dot-${payload.ciclo}`}
                        cx={cx}
                        cy={cy}
                        r={4.5}
                        fill={isDark ? '#0B1324' : '#FFFFFF'}
                        stroke={goldColor}
                        strokeWidth={2.5}
                      />
                    );
                  }}
                  activeDot={{ r: 5, fill: goldColor, strokeWidth: 0 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Row 3: Saúde do Orçamento + Radar de Atenção */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Card 1: Saúde do Orçamento */}
        <section className="min-w-0 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-[var(--shadow-card)]">
          <div>
            <h2 className="font-[var(--font-display)] text-base sm:text-[17px] font-semibold text-[var(--text-primary)] tracking-tight">
              Saúde do Orçamento
            </h2>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              Distribuição entre executado, comprometido e reserva
            </p>
          </div>

          {/* Segmented Horizontal Pill Bar */}
          <div className="mt-5 flex h-2.5 w-full items-center gap-1.5">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${panel.orcamento.executadoPct}%`,
                backgroundColor: brandColor,
              }}
              title={`Executado ${panel.orcamento.executadoPct}%`}
            />
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${panel.orcamento.comprometidoPct}%`,
                backgroundColor: skyColor,
              }}
              title={`Comprometido ${panel.orcamento.comprometidoPct}%`}
            />
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${panel.orcamento.reservaPct}%`,
                backgroundColor: positiveColor,
              }}
              title={`Reserva ${panel.orcamento.reservaPct}%`}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-[var(--text-secondary)]">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tabular-nums">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: brandColor }}
              />
              Executado · {panel.orcamento.executadoPct}%
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tabular-nums">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: skyColor }}
              />
              Comprometido · {panel.orcamento.comprometidoPct}%
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tabular-nums">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: positiveColor }}
              />
              Reserva · {panel.orcamento.reservaPct}%
            </span>
          </div>

          {/* Monthly Spend BarChart */}
          <div className="mt-6 h-[176px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={panel.orcamento.monthly}
                margin={{ top: 8, right: 8, left: -12, bottom: 2 }}
              >
                <CartesianGrid
                  stroke={gridColor}
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  axisLine={{ stroke: gridColor }}
                  tickLine={false}
                  dy={6}
                  tick={(props) => {
                    const { x, y, payload } = props;
                    const item = panel.orcamento.monthly.find(
                      (m) => m.month === payload?.value
                    );
                    return (
                      <text
                        x={x}
                        y={y}
                        dy={12}
                        textAnchor="middle"
                        fill={item?.isCurrent ? activeAxisColor : axisColor}
                        fontFamily="JetBrains Mono, monospace"
                        fontSize={11}
                        fontWeight={item?.isCurrent ? 700 : 400}
                      >
                        {payload?.value}
                      </text>
                    );
                  }}
                />
                <YAxis
                  domain={[0, 400]}
                  ticks={[0, 200, 400]}
                  axisLine={{ stroke: gridColor }}
                  tickLine={false}
                  tickFormatter={(v: number) => (v === 0 ? '0' : `${v}k`)}
                  tick={{
                    fill: axisColor,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11,
                  }}
                />
                <Tooltip
                  cursor={{
                    fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)',
                  }}
                  content={<BudgetTooltip />}
                />
                <Bar dataKey="valorK" radius={[6, 6, 0, 0]} maxBarSize={24}>
                  {panel.orcamento.monthly.map((entry) => (
                    <Cell
                      key={entry.month}
                      fill={
                        entry.isForecast
                          ? forecastBarColor
                          : entry.isCurrent
                            ? brandColor
                            : brandMutedBar
                      }
                      fillOpacity={entry.isCurrent ? 1 : 0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Card 2: Radar de Atenção */}
        <section className="min-w-0 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-[var(--shadow-card)]">
          <div>
            <h2 className="font-[var(--font-display)] text-base sm:text-[17px] font-semibold text-[var(--text-primary)] tracking-tight">
              Radar de Atenção
            </h2>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              Pontos prioritários que pedem acompanhamento
            </p>
          </div>

          <div className="mt-5 space-y-2.5">
            {panel.radarAtencao.map((item) => {
              const isMitigated = Boolean(mitigatedRadarIds[item.id]);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveRadarItem(item)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3.5 text-left transition-colors hover:border-[var(--border-brand)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/40"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      aria-hidden="true"
                      className={cn(
                        'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                        isMitigated
                          ? 'bg-[var(--status-positive)]'
                          : RADAR_TONE_DOT[item.tone]
                      )}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs sm:text-[13px] font-semibold text-[var(--text-primary)]">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                        {item.owner} · {item.dueDate}
                      </p>
                    </div>
                  </div>

                  <span
                    className={cn(
                      'inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap shrink-0',
                      isMitigated
                        ? RADAR_TONE_BADGE.positive
                        : RADAR_TONE_BADGE[item.tone]
                    )}
                  >
                    {isMitigated ? 'Mitigado' : item.statusLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Modal de Detalhamento do Radar de Atenção */}
      <Dialog
        open={Boolean(activeRadarItem)}
        onOpenChange={(open) => {
          if (!open) setActiveRadarItem(null);
        }}
      >
        <DialogContent className="max-w-lg">
          {activeRadarItem && activeRadarTarget && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 pr-6">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-semibold',
                      activeRadarMitigated
                        ? RADAR_TONE_BADGE.positive
                        : RADAR_TONE_BADGE[activeRadarItem.tone]
                    )}
                  >
                    {activeRadarMitigated
                      ? 'Mitigado'
                      : activeRadarItem.statusLabel}
                  </span>
                  <span className="font-mono text-[11px] text-[var(--text-muted)]">
                    Corte {panel.label}
                  </span>
                </div>
                <DialogTitle className="mt-2">
                  {activeRadarItem.title}
                </DialogTitle>
                <DialogDescription>
                  Detalhamento executivo e encaminhamento do ponto de atenção.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-2.5">
                    <User className="h-4 w-4 text-[var(--brand-primary)] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-[var(--text-muted)] uppercase">
                        Responsável
                      </p>
                      <p className="truncate text-xs font-semibold text-[var(--text-primary)]">
                        {activeRadarItem.owner}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-2.5">
                    <Clock className="h-4 w-4 text-[var(--brand-gold)] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-[var(--text-muted)] uppercase">
                        Prazo alvo
                      </p>
                      <p className="truncate font-mono text-xs font-semibold text-[var(--text-primary)]">
                        {activeRadarItem.dueDate}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Plano de ação atual
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-primary)]">
                    {activeRadarItem.actionNote}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => toggleRadarMitigated(activeRadarItem.id)}
                    className={cn(
                      'inline-flex h-9 items-center gap-1.5 rounded-xl border px-3.5 text-xs font-medium transition-colors cursor-pointer',
                      activeRadarMitigated
                        ? 'border-[var(--status-positive)]/40 bg-[var(--status-positive-soft)] text-[var(--status-positive)]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    )}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {activeRadarMitigated
                      ? 'Marcado como mitigado'
                      : 'Marcar como mitigado'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const target = activeRadarTarget.section;
                      setActiveRadarItem(null);
                      onSelectSection(target);
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[var(--brand-primary)] px-4 text-xs font-semibold text-white transition-colors hover:bg-[var(--brand-primary-hover)] cursor-pointer"
                  >
                    <span>{activeRadarTarget.ctaLabel}</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
