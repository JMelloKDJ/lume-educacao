'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLumeStore } from '../../services/lumeStore';
import { LumiAssistant } from '../lumi/lumi-assistant';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { ToastBanner, type ToastMessage } from '../ui/toast-banner';
import { TooltipProvider } from '../ui/tooltip';
import {
  AtualizarDadosModal,
  type ParsedSnapshotPayload,
} from '../workspace/AtualizarDadosModal';
import {
  NAV_ITEMS,
  Sidebar,
  type NavSectionId,
  type WorkspaceUserProfile,
} from './sidebar';
import { Topbar } from './topbar';

const STANDARD_COORDINATOR_PROFILE: WorkspaceUserProfile = {
  name: 'João Victor',
  role: 'Coordenação',
  initials: 'JV',
  email: 'coordenacao@lumeeducacao.org',
};

interface AppShellProps {
  activeSection: NavSectionId;
  onSelectSection: (section: NavSectionId) => void;
  onLogout?: () => void;
  lumiOpen?: boolean;
  onLumiOpenChange?: (open: boolean) => void;
  hideFloatingLumi?: boolean;
  children: (ctx: {
    openLumi: () => void;
    openUpdateModal: () => void;
    showToast: (title: string, description?: string) => void;
  }) => React.ReactNode;
}

export function AppShell({
  activeSection,
  onSelectSection,
  onLogout,
  lumiOpen: controlledLumiOpen,
  onLumiOpenChange,
  hideFloatingLumi = false,
  children,
}: AppShellProps) {
  const {
    cutoffId,
    panel,
    snapshot,
    alerts,
    setCutoffId,
    markAllAlertsRead,
    toggleAlertRead,
    updateProjectSnapshot,
    askLumiAssistant,
  } = useLumeStore();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [internalLumiOpen, setInternalLumiOpen] = useState(false);
  const lumiOpen = controlledLumiOpen ?? internalLumiOpen;
  const setLumiOpen = (next: boolean) => {
    if (onLumiOpenChange) onLumiOpenChange(next);
    else setInternalLumiOpen(next);
  };

  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((title: string, description?: string) => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToast({ id: `toast-${Date.now()}`, title, description });
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 4200);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const currentNav =
    NAV_ITEMS.find((item) => item.id === activeSection) ?? NAV_ITEMS[0];

  const handlePublishData = async (payload: ParsedSnapshotPayload) => {
    const updatedPanel = await updateProjectSnapshot({
      fileName: payload.fileName,
      cutoffId,
      avancoDeltaPct: payload.avancoDeltaPct,
      orcamentoDeltaPct: payload.orcamentoDeltaPct,
      entregasBonus: payload.entregasBonus,
      mapa3dProgressBoost: payload.mapa3dProgressBoost,
    });
    const nextAvanco = updatedPanel.kpis[0]?.value ?? '';
    showToast(
      'Atualização publicada com sucesso',
      `${payload.fileName} aplicado · Avanço geral recalculado para ${nextAvanco}.`
    );
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex min-h-screen w-full bg-[var(--bg-canvas)] text-[var(--text-primary)]">
        <Sidebar
          activeSection={activeSection}
          onSelectSection={onSelectSection}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
          mobileOpen={mobileMenuOpen}
          onMobileOpenChange={setMobileMenuOpen}
          onOpenAccountInfo={() => setAccountDialogOpen(true)}
          onLogout={onLogout}
          userProfile={STANDARD_COORDINATOR_PROFILE}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="mx-auto w-full max-w-[1320px] flex-1 px-4 pt-4 pb-28 sm:px-6 sm:pt-5 lg:px-8">
            <Topbar
              title={currentNav.pageTitle ?? currentNav.label}
              subtitle={currentNav.subtitle}
              cutoffId={cutoffId}
              snapshot={snapshot}
              onCutoffChange={(nextId) => {
                setCutoffId(nextId);
              }}
              alerts={alerts}
              onMarkAllAlertsRead={markAllAlertsRead}
              onToggleAlertRead={toggleAlertRead}
              onOpenUpdateModal={() => setUpdateDialogOpen(true)}
              onOpenMobileMenu={() => setMobileMenuOpen(true)}
            />

            <main className="mt-5 pb-24">
              {children({
                openLumi: () => setLumiOpen(true),
                openUpdateModal: () => setUpdateDialogOpen(true),
                showToast,
              })}
            </main>
          </div>
        </div>

        {/* Floating Lumi Assistant (standalone fallback if not mounted externally) */}
        {!hideFloatingLumi && (
          <LumiAssistant
            isOpen={lumiOpen}
            onOpenChange={setLumiOpen}
            snapshot={snapshot}
            userName="João"
            onAskLumi={askLumiAssistant}
          />
        )}

        {/* Toast confirmation banner */}
        <ToastBanner toast={toast} onDismiss={() => setToast(null)} />

        {/* Modal: Atualizar Dados do Projeto */}
        <AtualizarDadosModal
          open={updateDialogOpen}
          onOpenChange={setUpdateDialogOpen}
          defaultFileName={`boletim_${panel.fullLabel
            .toLowerCase()
            .replace(/\s+/g, '_')}.xlsx`}
          onPublish={handlePublishData}
        />

        {/* Modal: Perfil da Coordenação */}
        <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Conta da Coordenação</DialogTitle>
              <DialogDescription>
                Sessão ativa no workspace executivo da Lume Educação.
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand-primary-soft)] font-[var(--font-display)] text-sm font-bold text-[var(--brand-primary)]">
                {STANDARD_COORDINATOR_PROFILE.initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {STANDARD_COORDINATOR_PROFILE.name}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {STANDARD_COORDINATOR_PROFILE.role} · Lume Educação
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    setAccountDialogOpen(false);
                    onLogout();
                  }}
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Sair da conta
                </button>
              )}
              <button
                type="button"
                onClick={() => setAccountDialogOpen(false)}
                className="inline-flex h-9 items-center justify-center rounded-xl bg-[var(--brand-primary)] px-4 text-xs font-semibold text-white transition-colors hover:bg-[var(--brand-primary-hover)] cursor-pointer"
              >
                Continuar no workspace
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
