'use client';

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CutoffSnapshot } from '../../data/mock-project';
import { useTheme } from '../theme-provider';

interface PhysicalFinancialChartProps {
  snapshot: CutoffSnapshot;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey?: string;
    value?: number | null;
    payload?: {
      month: string;
      fullMonth: string;
      realizado: number | null;
      planejado: number;
    };
  }>;
  currentMonthShort: string;
}

function ChartTooltip({ active, payload, currentMonthShort }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  const isCutoff = point.month === currentMonthShort;

  return (
    <div className="rounded-xl border border-[var(--border-brand)] bg-[var(--bg-elevated)] px-3.5 py-2.5 shadow-[var(--shadow-popover)]">
      <p className="font-mono text-[11px] font-medium text-[var(--brand-primary)]">
        {point.fullMonth}
        {isCutoff ? ' · Corte Atual' : ''}
      </p>
      <div className="mt-1.5 space-y-1 font-mono text-xs tabular-nums">
        {point.realizado !== null && (
          <p className="font-semibold text-[var(--text-primary)]">
            Realizado: {point.realizado.toFixed(1).replace('.', ',')}%
          </p>
        )}
        <p className="text-[var(--text-secondary)]">
          Planejado: {point.planejado.toFixed(1).replace('.', ',')}%
        </p>
      </div>
    </div>
  );
}

export function PhysicalFinancialChart({ snapshot }: PhysicalFinancialChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const brandColor = isDark ? '#7C5CFC' : '#6747E6';
  const goldColor = isDark ? '#D4AF37' : '#C69C2B';
  const gridColor = isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(15, 23, 42, 0.08)';
  const axisColor = isDark ? '#64748B' : '#64748B';
  const activeAxisColor = isDark ? '#F8FAFC' : '#0F172A';

  return (
    <section
      aria-label="Gráfico de Avanço Físico e Financeiro"
      className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-[var(--shadow-card)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-[var(--font-display)] text-base sm:text-[17px] font-semibold text-[var(--text-primary)] tracking-tight">
            Avanço Físico × Financeiro
          </h3>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Evolução acumulada por mês
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-[var(--text-secondary)]">
          <span className="inline-flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: brandColor }}
            />
            Realizado
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: goldColor }}
            />
            Planejado
          </span>
        </div>
      </div>

      <div className="mt-5 h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={snapshot.series}
            margin={{ top: 12, right: 12, left: -16, bottom: 4 }}
          >
            <defs>
              <linearGradient id="lumeRealizadoFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={brandColor} stopOpacity={isDark ? 0.34 : 0.22} />
                <stop offset="100%" stopColor={brandColor} stopOpacity={0.01} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke={gridColor}
              strokeDasharray="0"
              vertical={false}
            />

            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              dy={8}
              tick={(props) => {
                const { x, y, payload } = props;
                const isCurrent = payload?.value === snapshot.currentMonthShort;
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
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v}%`}
              tick={{
                fill: axisColor,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11,
              }}
            />

            <ReferenceLine
              x={snapshot.currentMonthShort}
              stroke={brandColor}
              strokeOpacity={0.35}
              strokeDasharray="3 3"
            />

            <Tooltip
              cursor={{
                stroke: brandColor,
                strokeWidth: 1,
                strokeOpacity: 0.3,
              }}
              content={
                <ChartTooltip currentMonthShort={snapshot.currentMonthShort} />
              }
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
              fill="url(#lumeRealizadoFill)"
              connectNulls={false}
              dot={(props) => {
                const { cx, cy, payload } = props;
                if (
                  cx === undefined ||
                  cy === undefined ||
                  payload?.month !== snapshot.currentMonthShort ||
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
        </ResponsiveContainer>
      </div>
    </section>
  );
}
