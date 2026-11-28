'use client';

import React from 'react';
import {
  Box,
  Calendar,
  FileText,
  Layers,
  LayoutGrid,
  LogOut,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  SlidersVertical,
  Sun,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../theme-provider';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

export type NavSectionId =
  | 'painel'
  | 'cenarios'
  | 'mapa3d'
  | 'cronograma'
  | 'riscos'
  | 'produto'
  | 'relatorios';

export interface NavItemConfig {
  id: NavSectionId;
  label: string;
  pageTitle?: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  group: 'WORKSPACE' | 'RECURSOS';
}

export const NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'painel',
    label: 'Painel Geral',
    subtitle: 'Visão executiva do programa',
    icon: LayoutGrid,
    group: 'WORKSPACE',
  },
  {
    id: 'cenarios',
    label: 'Decisão & Cenários',
    subtitle: 'Simulador de alternativas e impacto executivo',
    icon: SlidersVertical,
    group: 'WORKSPACE',
  },
  {
    id: 'mapa3d',
    label: 'Mapa 3D',
    pageTitle: 'Mapa 3D Operacional',
    subtitle: 'Arquitetura espacial de entregas e dependências',
    icon: Box,
    group: 'WORKSPACE',
  },
  {
    id: 'cronograma',
    label: 'Cronograma',
    subtitle: 'Marcos físicos e entregas por fase',
    icon: Calendar,
    group: 'WORKSPACE',
  },
  {
    id: 'riscos',
    label: 'Riscos & Metas',
    subtitle: 'Matriz de desvios e mitigação',
    icon: Shield,
    group: 'WORKSPACE',
  },
  {
    id: 'produto',
    label: 'Produto',
    subtitle: 'Telas da experiência Lume Educação',
    icon: Layers,
    group: 'RECURSOS',
  },
  {
    id: 'relatorios',
    label: 'Relatórios',
    subtitle: 'Exportações executivas por corte',
    icon: FileText,
    group: 'RECURSOS',
  },
];

function LumeBrandMark() {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)] text-white shadow-xs">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M12 2.75L14.2 9.8L21.25 12L14.2 14.2L12 21.25L9.8 14.2L2.75 12L9.8 9.8L12 2.75Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

export interface WorkspaceUserProfile {
  name: string;
  role: string;
  initials: string;
  email?: string;
}

interface SidebarProps {
  activeSection: NavSectionId;
  onSelectSection: (section: NavSectionId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  onOpenAccountInfo: () => void;
  onLogout?: () => void;
  userProfile?: WorkspaceUserProfile;
}

export function Sidebar({
  activeSection,
  onSelectSection,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileOpenChange,
  onOpenAccountInfo,
  onLogout,
  userProfile = { name: 'João Victor', role: 'Coordenação', initials: 'JV' },
}: SidebarProps) {
  const { theme, setTheme } = useTheme();
  const workspaceItems = NAV_ITEMS.filter((item) => item.group === 'WORKSPACE');
  const resourceItems = NAV_ITEMS.filter((item) => item.group === 'RECURSOS');

  const renderNavButton = (item: NavItemConfig, isCompact: boolean) => {
    const Icon = item.icon;
    const isActive = activeSection === item.id;

    const buttonEl = (
      <button
        type="button"
        onClick={() => {
          onSelectSection(item.id);
          onMobileOpenChange(false);
        }}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'group flex w-full items-center rounded-xl text-[13px] font-medium transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/40',
          isCompact ? 'h-10 justify-center px-0' : 'h-10 gap-3 px-3',
          isActive
            ? 'bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] font-semibold'
            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
        )}
      >
        <Icon
          className={cn(
            'h-[18px] w-[18px] shrink-0 transition-colors',
            isActive
              ? 'text-[var(--brand-primary)]'
              : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
          )}
        />
        {!isCompact && <span className="truncate whitespace-nowrap">{item.label}</span>}
      </button>
    );

    if (isCompact) {
      return (
        <Tooltip key={item.id} delayDuration={120}>
          <TooltipTrigger asChild>{buttonEl}</TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      );
    }

    return <div key={item.id}>{buttonEl}</div>;
  };

  const renderSidebarInner = (isCompact: boolean, isMobile = false) => (
    <div className="flex h-full flex-col bg-[var(--bg-sidebar)] text-[var(--text-primary)]">
      {/* Brand Header */}
      <div
        className={cn(
          'flex shrink-0 border-b border-[var(--border-subtle)]',
          isCompact ? 'flex-col items-center gap-3 px-3 py-4' : 'items-center justify-between px-4 py-4'
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <LumeBrandMark />
          {!isCompact && (
            <div className="min-w-0">
              <p className="truncate font-[var(--font-display)] text-sm font-bold leading-tight text-[var(--text-primary)]">
                Lume Educação
              </p>
              <p className="truncate text-[11px] text-[var(--text-muted)] leading-tight mt-0.5">
                Gestão Executiva
              </p>
            </div>
          )}
        </div>

        {isMobile ? (
          <button
            type="button"
            onClick={() => onMobileOpenChange(false)}
            aria-label="Fechar menu de navegação"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onToggleCollapse}
                aria-label={isCompact ? 'Expandir barra lateral' : 'Recolher barra lateral'}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/40 cursor-pointer shrink-0"
              >
                {isCompact ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isCompact ? 'Expandir menu' : 'Recolher menu'}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Navigation Groups */}
      <nav aria-label="Navegação principal" className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div className="space-y-1">
          {!isCompact && (
            <p className="px-3 pb-1.5 text-[10px] font-semibold tracking-[0.08em] text-[var(--text-muted)] uppercase">
              Workspace
            </p>
          )}
          {workspaceItems.map((item) => renderNavButton(item, isCompact))}
        </div>

        <div className="space-y-1">
          {!isCompact ? (
            <p className="px-3 pb-1.5 text-[10px] font-semibold tracking-[0.08em] text-[var(--text-muted)] uppercase">
              Recursos
            </p>
          ) : (
            <div className="mx-2 my-2 border-t border-[var(--border-subtle)]" />
          )}
          {resourceItems.map((item) => renderNavButton(item, isCompact))}
        </div>
      </nav>

      {/* Mobile-only theme switcher inside drawer */}
      {isMobile && (
        <div className="px-3 pb-3">
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={cn(
                'inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors cursor-pointer',
                theme === 'light'
                  ? 'bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]'
                  : 'text-[var(--text-muted)]'
              )}
            >
              <Sun className="h-3.5 w-3.5" />
              Claro
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={cn(
                'inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors cursor-pointer',
                theme === 'dark'
                  ? 'bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]'
                  : 'text-[var(--text-muted)]'
              )}
            >
              <Moon className="h-3.5 w-3.5" />
              Escuro
            </button>
          </div>
        </div>
      )}

      {/* User Profile Card Footer */}
      <div className="shrink-0 border-t border-[var(--border-subtle)] p-3">
        {isCompact ? (
          <div className="flex flex-col items-center gap-2">
            <Tooltip delayDuration={120}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onOpenAccountInfo}
                  aria-label={`Perfil de ${userProfile.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-primary-soft)] font-[var(--font-display)] text-xs font-bold text-[var(--brand-primary)] transition-colors hover:bg-[var(--brand-primary-soft-hover)] cursor-pointer"
                >
                  {userProfile.initials}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {userProfile.name} · {userProfile.role}
              </TooltipContent>
            </Tooltip>

            <Tooltip delayDuration={120}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => {
                    onMobileOpenChange(false);
                    if (onLogout) onLogout();
                    else onOpenAccountInfo();
                  }}
                  aria-label="Sair do workspace"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Sair</TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2.5">
            <button
              type="button"
              onClick={onOpenAccountInfo}
              className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer focus-visible:outline-none"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary-soft)] font-[var(--font-display)] text-xs font-bold text-[var(--brand-primary)]">
                {userProfile.initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-[var(--text-primary)] leading-tight">
                  {userProfile.name}
                </p>
                <p className="truncate text-[11px] text-[var(--text-muted)] leading-tight mt-0.5">
                  {userProfile.role}
                </p>
              </div>
            </button>
            <Tooltip delayDuration={120}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => {
                    onMobileOpenChange(false);
                    if (onLogout) onLogout();
                    else onOpenAccountInfo();
                  }}
                  aria-label="Sair do workspace"
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Sair</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex shrink-0 flex-col border-r border-[var(--border-subtle)] transition-[width] duration-200 ease-out',
          collapsed ? 'w-[72px]' : 'w-[240px]'
        )}
      >
        {renderSidebarInner(collapsed)}
      </aside>

      {/* Mobile & Tablet Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px]"
            onClick={() => onMobileOpenChange(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-[264px] border-r border-[var(--border-subtle)] shadow-2xl">
            {renderSidebarInner(false, true)}
          </aside>
        </div>
      )}
    </>
  );
}
