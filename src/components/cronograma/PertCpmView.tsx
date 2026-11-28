'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Diamond,
  Filter,
  GitBranch,
  Info,
  RotateCcw,
} from 'lucide-react';
import {
  PERT_DISCIPLINA_LABEL,
  type PertAtividadeCalculada,
  type PertCpmNetworkResult,
} from '../../data/pertCpmData';
import type { IslandId } from '../../data/mapa3dData';
import { cn } from '../../lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../ui/tooltip';

interface PertCpmViewProps {
  network: PertCpmNetworkResult;
  baselineDuration: number;
  frontFilter: 'todas' | IslandId;
  hasActiveCrash: boolean;
  onResetCrash?: () => void;
}

function formatPredecessoras(item: PertAtividadeCalculada): string {
  if (item.predecessoras.length === 0) return 'Início do projeto';
  return item.predecessoras
    .map((p) => {
      const lag = p.defasagem_du ? ` +${p.defasagem_du}du` : '';
      return `${p.id} (${p.tipo}${lag})`;
    })
    .join(', ');
}

function formatSigma(val: number): string {
  return val.toFixed(2).replace('.', ',');
}

export function PertCpmView({
  network,
  baselineDuration,
  frontFilter,
  hasActiveCrash,
  onResetCrash,
}: PertCpmViewProps) {
  const [onlyCritical, setOnlyCritical] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(
    null
  );

  // O cálculo ES/EF/LS/LF/FT roda sempre na rede completa; os filtros apenas recortam a visualização.
  const visibleActivities = useMemo(() => {
    return network.atividades.filter((item) => {
      const matchesFront =
        frontFilter === 'todas' || item.disciplina === frontFilter;
      const matchesCritical = !onlyCritical || item.e_critica;
      return matchesFront && matchesCritical;
    });
  }, [network.atividades, frontFilter, onlyCritical]);

  const selectedActivity = useMemo(
    () =>
      network.atividades.find((a) => a.id_atividade === selectedActivityId) ??
      null,
    [network.atividades, selectedActivityId]
  );

  const scaleTicks = useMemo(() => {
    const total = Math.max(1, network.prazo_total_du);
    const step = total <= 40 ? 10 : 20;
    const ticks: number[] = [1];
    for (let d = step; d < total; d += step) {
      ticks.push(d);
    }
    if (ticks[ticks.length - 1] !== total) {
      ticks.push(total);
    }
    return ticks;
  }, [network.prazo_total_du]);

  const savedDays = Math.max(0, baselineDuration - network.prazo_total_du);

  return (
    <div className="space-y-5">
      {/* Banner discreto se houver simulação de Crashing ativa */}
      {hasActiveCrash && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border-brand)] bg-[var(--brand-primary-soft)]/50 px-4 py-3 text-xs">
          <div className="flex items-center gap-2 text-[var(--text-primary)]">
            <GitBranch className="h-4 w-4 shrink-0 text-[var(--brand-primary)]" />
            <span>
              Visualizando a rede recalculada com a simulação de{' '}
              <strong>Crashing</strong> ativa
              {savedDays > 0
                ? ` (-${savedDays} du no prazo total · ${baselineDuration} → ${network.prazo_total_du} du).`
                : ' (sem redução líquida no prazo total).'}
            </span>
          </div>
          {onResetCrash && (
            <button
              type="button"
              onClick={onResetCrash}
              className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-[var(--border-brand)] bg-[var(--bg-surface)] px-2.5 text-[11px] font-semibold text-[var(--brand-primary)] transition-colors hover:bg-[var(--bg-elevated)] cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              Voltar ao baseline
            </button>
          )}
        </div>
      )}

      {/* Card 1 — Diagrama de Barras PERT/CPM — Caminho Crítico e Folgas */}
      <section
        aria-label="Diagrama de Barras PERT/CPM — Caminho Crítico e Folgas"
        className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)]"
      >
        {/* Header com toggle e legenda */}
        <div className="flex flex-col gap-3 border-b border-[var(--border-subtle)] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-[var(--font-display)] text-sm sm:text-base font-semibold text-[var(--text-primary)]">
              Diagrama de Barras PERT/CPM — Caminho Crítico e Folgas
            </h2>
            <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
              Horizonte determinístico de 1 a{' '}
              <span className="font-mono font-semibold text-[var(--text-secondary)]">
                {network.prazo_total_du} du
              </span>{' '}
              · Passe o mouse ou clique em uma barra para inspecionar ES, EF, LS,
              LF, folgas e predecessoras
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Legenda visual */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--text-secondary)]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[var(--status-critical)]" />
                Caminho Crítico
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[var(--brand-primary)]" />
                Atividade com Folga
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-4 rounded-sm border border-dashed border-[var(--brand-gold)] bg-[var(--brand-gold-soft)]" />
                Folga Total (FT)
              </span>
            </div>

            {/* Toggle Filtrar só caminho crítico */}
            <button
              type="button"
              onClick={() => setOnlyCritical((prev) => !prev)}
              aria-pressed={onlyCritical}
              className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-colors cursor-pointer',
                onlyCritical
                  ? 'border-[var(--status-critical)]/50 bg-[var(--status-critical-soft)] font-semibold text-[var(--status-critical)]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
              )}
            >
              <Filter className="h-3.5 w-3.5" />
              {onlyCritical
                ? 'Mostrar todas as atividades'
                : 'Filtrar só caminho crítico'}
            </button>
          </div>
        </div>

        {visibleActivities.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--text-secondary)]">
            Nenhuma atividade encontrada para os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[820px]">
              {/* Cabeçalho de escala proporcional */}
              <div className="grid grid-cols-[270px_minmax(0,1fr)_104px] border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/70 px-5 py-2.5 text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
                <span>ID · Atividade</span>
                <div className="relative h-4">
                  {scaleTicks.map((tick) => {
                    const pct =
                      tick === 1
                        ? 0
                        : ((tick - 1) / Math.max(1, network.prazo_total_du - 1)) *
                          100;
                    return (
                      <span
                        key={tick}
                        className={cn(
                          'absolute top-0 font-mono text-[10px] text-[var(--text-muted)] tabular-nums',
                          tick === 1
                            ? 'left-0'
                            : tick === network.prazo_total_du
                              ? 'right-0'
                              : '-translate-x-1/2'
                        )}
                        style={
                          tick === 1 || tick === network.prazo_total_du
                            ? undefined
                            : { left: `${pct}%` }
                        }
                      >
                        D{tick}
                      </span>
                    );
                  })}
                </div>
                <span className="text-right">Criticidade</span>
              </div>

              {/* Linhas das atividades */}
              <div className="divide-y divide-[var(--border-subtle)]/70">
                {visibleActivities.map((item) => {
                  const totalSpan = Math.max(1, network.prazo_total_du);
                  const leftPct = ((item.es - 1) / totalSpan) * 100;
                  const widthPct = (item.duracao_du / totalSpan) * 100;
                  const ftLeftPct = leftPct + widthPct;
                  const ftWidthPct = (item.ft / totalSpan) * 100;
                  const isSelected = selectedActivityId === item.id_atividade;

                  return (
                    <div
                      key={item.id_atividade}
                      onClick={() =>
                        setSelectedActivityId((prev) =>
                          prev === item.id_atividade ? null : item.id_atividade
                        )
                      }
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedActivityId((prev) =>
                            prev === item.id_atividade
                              ? null
                              : item.id_atividade
                          );
                        }
                      }}
                      className={cn(
                        'grid grid-cols-[270px_minmax(0,1fr)_104px] items-center gap-4 px-5 py-2.5 transition-colors cursor-pointer',
                        isSelected
                          ? 'bg-[var(--brand-primary-soft)]/40'
                          : item.e_critica
                            ? 'bg-[var(--status-critical-soft)]/15 hover:bg-[var(--status-critical-soft)]/25'
                            : 'hover:bg-[var(--bg-elevated)]/60'
                      )}
                    >
                      {/* Coluna 1: ID · Nome */}
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              'shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold',
                              item.e_critica
                                ? 'bg-[var(--status-critical-soft)] text-[var(--status-critical)]'
                                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                            )}
                          >
                            {item.id_atividade}
                          </span>
                          {item.tipo_atividade === 'MARCO_AGIL' && (
                            <Diamond className="h-3 w-3 shrink-0 fill-current text-[var(--brand-gold)]" />
                          )}
                          <span className="truncate text-xs font-medium text-[var(--text-primary)]">
                            {item.nome_atividade}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                          <span>{PERT_DISCIPLINA_LABEL[item.disciplina]}</span>
                          <span>·</span>
                          <span className="font-mono tabular-nums">
                            {item.duracao_du} du
                          </span>
                          {item.reducao_aplicada_du > 0 && (
                            <span className="font-mono font-semibold text-[var(--brand-primary)]">
                              (-{item.reducao_aplicada_du}du crash)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Coluna 2: Trilho proporcional + Tooltip */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="relative h-7 w-full rounded-lg bg-[var(--bg-elevated)]/70 border border-[var(--border-subtle)]/60">
                            {/* Linhas guia verticais */}
                            {scaleTicks.slice(1, -1).map((tick) => {
                              const pct =
                                ((tick - 1) / Math.max(1, totalSpan - 1)) * 100;
                              return (
                                <div
                                  key={tick}
                                  aria-hidden="true"
                                  className="pointer-events-none absolute top-0 bottom-0 w-px bg-[var(--border-subtle)]/60"
                                  style={{ left: `${pct}%` }}
                                />
                              );
                            })}

                            {/* Barra principal */}
                            <div
                              className={cn(
                                'absolute top-1 bottom-1 flex items-center justify-center overflow-hidden rounded-md px-1 font-mono text-[10px] font-semibold text-white shadow-xs transition-all duration-200',
                                item.e_critica
                                  ? 'bg-[var(--status-critical)]'
                                  : 'bg-[var(--brand-primary)]'
                              )}
                              style={{
                                left: `${leftPct}%`,
                                width: `${widthPct}%`,
                                minWidth: '10px',
                              }}
                            >
                              {widthPct >= 6 && (
                                <span className="truncate drop-shadow-xs">
                                  {item.es}–{item.ef}
                                </span>
                              )}
                            </div>

                            {/* Barra translúcida/tracejada de Folga Total (FT) */}
                            {item.ft > 0 && (
                              <div
                                aria-label={`Folga total de ${item.ft} dias úteis`}
                                className="absolute top-1.5 bottom-1.5 rounded-r-md border border-dashed border-[var(--brand-gold)]/80 bg-[var(--brand-gold-soft)] transition-all duration-200"
                                style={{
                                  left: `${ftLeftPct}%`,
                                  width: `${Math.min(100 - ftLeftPct, ftWidthPct)}%`,
                                  minWidth: '6px',
                                }}
                              />
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="max-w-xs space-y-2 p-3 text-left"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-mono text-[11px] font-bold text-[var(--text-primary)]">
                              {item.id_atividade} · EAP {item.codigo_eap}
                            </span>
                            <span
                              className={cn(
                                'rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase',
                                item.e_critica
                                  ? 'bg-[var(--status-critical-soft)] text-[var(--status-critical)]'
                                  : 'bg-[var(--status-positive-soft)] text-[var(--status-positive)]'
                              )}
                            >
                              {item.e_critica ? 'Crítica' : `FT +${item.ft} du`}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-[var(--text-primary)]">
                            {item.nome_atividade}
                          </p>
                          <div className="grid grid-cols-4 gap-1.5 rounded-lg bg-[var(--bg-elevated)] p-2 font-mono text-[10px] tabular-nums">
                            <div>
                              <span className="block text-[var(--text-muted)]">
                                ES
                              </span>
                              <strong className="text-[var(--text-primary)]">
                                {item.es}
                              </strong>
                            </div>
                            <div>
                              <span className="block text-[var(--text-muted)]">
                                EF
                              </span>
                              <strong className="text-[var(--text-primary)]">
                                {item.ef}
                              </strong>
                            </div>
                            <div>
                              <span className="block text-[var(--text-muted)]">
                                LS
                              </span>
                              <strong className="text-[var(--text-primary)]">
                                {item.ls}
                              </strong>
                            </div>
                            <div>
                              <span className="block text-[var(--text-muted)]">
                                LF
                              </span>
                              <strong className="text-[var(--text-primary)]">
                                {item.lf}
                              </strong>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 font-mono text-[10px] text-[var(--text-secondary)] tabular-nums">
                            <span>
                              Duração:{' '}
                              <strong className="text-[var(--text-primary)]">
                                {item.duracao_du} du
                              </strong>
                            </span>
                            <span>
                              FT / FL:{' '}
                              <strong className="text-[var(--text-primary)]">
                                {item.ft} / {item.fl}
                              </strong>
                            </span>
                            <span>
                              σ:{' '}
                              <strong className="text-[var(--text-primary)]">
                                ±{formatSigma(item.desvio_padrao_du)}
                              </strong>
                            </span>
                          </div>
                          <p className="text-[10px] text-[var(--text-muted)]">
                            Predecessoras:{' '}
                            <span className="font-mono text-[var(--text-secondary)]">
                              {formatPredecessoras(item)}
                            </span>
                          </p>
                        </TooltipContent>
                      </Tooltip>

                      {/* Coluna 3: Badge CRÍTICA ou +X du */}
                      <div className="flex justify-end">
                        {item.e_critica ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-[var(--status-critical)]/40 bg-[var(--status-critical-soft)] px-2 py-0.5 font-mono text-[10px] font-bold tracking-wide text-[var(--status-critical)] uppercase">
                            CRÍTICA
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-0.5 font-mono text-[10px] font-semibold text-[var(--brand-gold)] tabular-nums">
                            +{item.ft} du
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Painel rápido de inspeção ao clicar em uma barra */}
              {selectedActivity && (
                <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]/80 px-5 py-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs">
                      <Info className="h-4 w-4 shrink-0 text-[var(--brand-primary)]" />
                      <span className="font-mono font-bold text-[var(--text-primary)]">
                        {selectedActivity.id_atividade}
                      </span>
                      <span className="font-semibold text-[var(--text-primary)]">
                        {selectedActivity.nome_atividade}
                      </span>
                      <span className="text-[var(--text-muted)]">
                        ({PERT_DISCIPLINA_LABEL[selectedActivity.disciplina]})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedActivityId(null)}
                      className="text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                    >
                      Fechar detalhe
                    </button>
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 font-mono text-[11px] text-[var(--text-secondary)] tabular-nums">
                    <span>
                      Duração:{' '}
                      <strong className="text-[var(--text-primary)]">
                        {selectedActivity.duracao_du} du
                      </strong>{' '}
                      (O={selectedActivity.duracao_otimista_du} · M=
                      {selectedActivity.duracao_mais_provavel_du} · P=
                      {selectedActivity.duracao_pessimista_du})
                    </span>
                    <span>
                      ES/EF:{' '}
                      <strong className="text-[var(--text-primary)]">
                        {selectedActivity.es}–{selectedActivity.ef}
                      </strong>
                    </span>
                    <span>
                      LS/LF:{' '}
                      <strong className="text-[var(--text-primary)]">
                        {selectedActivity.ls}–{selectedActivity.lf}
                      </strong>
                    </span>
                    <span>
                      FT:{' '}
                      <strong
                        className={
                          selectedActivity.e_critica
                            ? 'text-[var(--status-critical)]'
                            : 'text-[var(--brand-gold)]'
                        }
                      >
                        {selectedActivity.ft} du
                      </strong>
                    </span>
                    <span>
                      FL:{' '}
                      <strong className="text-[var(--text-primary)]">
                        {selectedActivity.fl} du
                      </strong>
                    </span>
                    <span>
                      σ:{' '}
                      <strong className="text-[var(--text-primary)]">
                        ±{formatSigma(selectedActivity.desvio_padrao_du)} du
                      </strong>
                    </span>
                    <span>
                      Predecessoras:{' '}
                      <strong className="text-[var(--text-primary)]">
                        {formatPredecessoras(selectedActivity)}
                      </strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Card 2 — Tabela Completa PERT / CPM */}
      <section
        aria-label="Tabela Completa PERT / CPM"
        className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-4">
          <div>
            <h2 className="font-[var(--font-display)] text-sm sm:text-base font-semibold text-[var(--text-primary)]">
              Tabela Completa PERT / CPM
            </h2>
            <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
              Cálculo determinístico de ida (ES/EF), volta (LS/LF), Folga Total
              (FT) e Folga Livre (FL) em dias úteis
            </p>
          </div>
          <span className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1 font-mono text-[11px] text-[var(--text-secondary)] tabular-nums">
            Exibindo {visibleActivities.length} de {network.total_atividades}{' '}
            atividades
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/70 font-mono text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Atividade</th>
                <th className="px-3 py-3">Frente</th>
                <th className="px-3 py-3 text-right">Duração (du)</th>
                <th className="px-3 py-3 text-right">ES</th>
                <th className="px-3 py-3 text-right">EF</th>
                <th className="px-3 py-3 text-right">LS</th>
                <th className="px-3 py-3 text-right">LF</th>
                <th className="px-3 py-3 text-right">Folga Total (FT)</th>
                <th className="px-3 py-3 text-right">Folga Livre (FL)</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-xs">
              {visibleActivities.map((item) => (
                <tr
                  key={item.id_atividade}
                  onClick={() =>
                    setSelectedActivityId((prev) =>
                      prev === item.id_atividade ? null : item.id_atividade
                    )
                  }
                  className={cn(
                    'transition-colors cursor-pointer',
                    item.e_critica
                      ? 'border-l-2 border-l-[var(--status-critical)] bg-[var(--status-critical-soft)]/15 hover:bg-[var(--status-critical-soft)]/25'
                      : 'hover:bg-[var(--bg-elevated)]/60'
                  )}
                >
                  <td className="px-4 py-3 font-mono text-[11px] font-bold text-[var(--text-primary)]">
                    {item.id_atividade}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {item.tipo_atividade === 'MARCO_AGIL' && (
                        <Diamond className="h-3 w-3 shrink-0 fill-current text-[var(--brand-gold)]" />
                      )}
                      <span className="font-medium text-[var(--text-primary)]">
                        {item.nome_atividade}
                      </span>
                    </div>
                    <p className="mt-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                      EAP {item.codigo_eap} · Pred: {formatPredecessoras(item)} ·
                      σ ±{formatSigma(item.desvio_padrao_du)}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-[var(--text-secondary)]">
                    {PERT_DISCIPLINA_LABEL[item.disciplina]}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-semibold text-[var(--text-primary)] tabular-nums">
                    {item.duracao_du}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-[var(--text-secondary)] tabular-nums">
                    {item.es}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-[var(--text-secondary)] tabular-nums">
                    {item.ef}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-[var(--text-secondary)] tabular-nums">
                    {item.ls}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-[var(--text-secondary)] tabular-nums">
                    {item.lf}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-semibold tabular-nums">
                    <span
                      className={
                        item.ft === 0
                          ? 'text-[var(--status-critical)]'
                          : 'text-[var(--brand-gold)]'
                      }
                    >
                      {item.ft} du
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-[var(--text-secondary)] tabular-nums">
                    {item.fl} du
                  </td>
                  <td className="px-4 py-3 text-right">
                    {item.e_critica ? (
                      <span className="inline-flex items-center gap-1 rounded-md border border-[var(--status-critical)]/40 bg-[var(--status-critical-soft)] px-2 py-0.5 font-mono text-[10px] font-semibold text-[var(--status-critical)]">
                        <AlertTriangle className="h-3 w-3" />
                        Crítico
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md border border-[var(--status-positive)]/35 bg-[var(--status-positive-soft)] px-2 py-0.5 font-mono text-[10px] font-semibold text-[var(--status-positive)]">
                        <CheckCircle2 className="h-3 w-3" />
                        Com folga
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
