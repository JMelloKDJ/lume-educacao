'use client';

import Link from 'next/link';
import { ClipboardList, Download, FileSpreadsheet, TrendingUp } from 'lucide-react';
import type { NavSectionId } from '../components/layout/sidebar';
import type { ScenarioItem } from '../data/workspaceData';
import { useLumeStore } from '../services/lumeStore';
import { CenariosPage } from './app/CenariosPage';
import { CronogramaPage } from './app/CronogramaPage';
import { Mapa3DPage } from './app/Mapa3DPage';
import { PainelGeralPage } from './app/PainelGeralPage';
import { ProdutoPage } from './app/ProdutoPage';
import { RiscosMetasPage } from './app/RiscosMetasPage';

interface WorkspaceRouterProps {
  activeSection: NavSectionId;
  onSelectSection: (section: NavSectionId) => void;
  openLumi: () => void;
  openUpdateModal: () => void;
  showToast: (title: string, description?: string) => void;
}

export function Round1Demo({
  activeSection,
  onSelectSection,
  openLumi,
  openUpdateModal,
  showToast,
}: WorkspaceRouterProps) {
  const {
    panel,
    lastSyncLabel,
    publications,
    mapa3dCounts,
    approvedScenarioId,
    scenarios,
  } = useLumeStore();

  if (activeSection === 'painel') {
    return <PainelGeralPage onSelectSection={onSelectSection} />;
  }

  if (activeSection === 'cenarios') {
    const handleApproveScenario = (scenario: ScenarioItem) => {
      showToast(
        `Cenário "${scenario.name}" aprovado`,
        `Meta definida para ${scenario.prazoFinal} com retorno estimado de ${scenario.retornoLabel}.`
      );
    };
    return <CenariosPage onApproveScenario={handleApproveScenario} />;
  }

  if (activeSection === 'cronograma') {
    return (
      <CronogramaPage
        onSelectSection={onSelectSection}
        openUpdateModal={openUpdateModal}
      />
    );
  }

  if (activeSection === 'riscos') {
    return (
      <RiscosMetasPage
        onSelectSection={onSelectSection}
        openLumi={openLumi}
        showToast={showToast}
      />
    );
  }

  if (activeSection === 'produto') {
    return <ProdutoPage />;
  }

  if (activeSection === 'relatorios') {
    const handleDownloadReport = (format: 'json' | 'csv', pubTitle: string) => {
      const approvedSc = approvedScenarioId
        ? scenarios.find((s) => s.id === approvedScenarioId)?.name ?? 'Nenhum'
        : 'Em análise';

      let content = '';
      let mime = 'application/json;charset=utf-8';
      let ext = 'json';

      if (format === 'json') {
        content = JSON.stringify(
          {
            programa: 'Lume Educação',
            boletim: pubTitle,
            corte: panel.fullLabel,
            atualizacao: lastSyncLabel,
            cenarioAprovado: approvedSc,
            kpis: panel.kpis.map((k) => ({
              indicador: k.title,
              valor: k.value,
              variacao: k.badgeText,
            })),
            mapa3d: mapa3dCounts,
          },
          null,
          2
        );
      } else {
        mime = 'text/csv;charset=utf-8';
        ext = 'csv';
        const rows = [
          ['Indicador', 'Valor', 'Referência', 'Observação'],
          ...panel.kpis.map((k) => [k.title, k.value, k.badgeText, k.insight]),
        ];
        content = rows
          .map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
          .join('\n');
      }

      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lume_${panel.cutoffId}_relatorio.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(
        `Relatório ${ext.toUpperCase()} exportado`,
        `${pubTitle} baixado com os indicadores atualizados de ${panel.label}.`
      );
    };

    return (
      <div className="space-y-5">
        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-[var(--font-display)] text-base sm:text-[17px] font-semibold text-[var(--text-primary)]">
                Histórico de Publicações
              </h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                Boletins consolidados que alimentam o painel executivo · {lastSyncLabel}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/lancamentos"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
              >
                <ClipboardList className="h-3.5 w-3.5" />
                Lançamentos (B1–B10)
              </Link>
              <Link
                href="/preditiva"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                Visão Técnica (Supabase)
              </Link>
              <button
                type="button"
                onClick={() =>
                  handleDownloadReport('csv', `Resumo ${panel.fullLabel}`)
                }
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--border-strong)] cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                Exportar CSV
              </button>
              <button
                type="button"
                onClick={openUpdateModal}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[var(--brand-primary)] px-4 text-xs font-semibold text-white transition-colors hover:bg-[var(--brand-primary-hover)] cursor-pointer"
              >
                Nova publicação
              </button>
            </div>
          </div>

          <div className="mt-5 space-y-2.5">
            {publications.map((pub) => (
              <div
                key={pub.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3.5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
                    <FileSpreadsheet className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs sm:text-[13px] font-semibold text-[var(--text-primary)]">
                      {pub.title} · {pub.publishedAt}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-[var(--text-muted)]">
                      {pub.fileName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="rounded-md bg-[var(--status-positive-soft)] px-2.5 py-1 font-mono text-[11px] font-semibold text-[var(--status-positive)]">
                    Publicado
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDownloadReport('json', pub.title)}
                    aria-label={`Baixar JSON de ${pub.title}`}
                    className="inline-flex h-7 items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 text-[11px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    <Download className="h-3 w-3" />
                    JSON
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return <Mapa3DPage />;
}
