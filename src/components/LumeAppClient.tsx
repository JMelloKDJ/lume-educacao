'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import type {
  NavSectionId,
  WorkspaceUserProfile,
} from '@/components/layout/sidebar';
import { LumiAssistant } from '@/components/lumi/lumi-assistant';
import type { AppScreen } from '@/components/public/public-navbar';
import { ThemeProvider } from '@/components/theme-provider';
import { LandingPage } from '@/views/LandingPage';
import { LoginPage } from '@/views/LoginPage';
import { Round1Demo } from '@/views/round1-demo';
import { SobrePage } from '@/views/SobrePage';
import { LumeStoreProvider, useLumeStore } from '@/services/lumeStore';

const SESSION_KEY = 'lume-educacao-session';

const STANDARD_PROFILE: WorkspaceUserProfile = {
  name: 'João Victor',
  role: 'Coordenação',
  initials: 'JV',
  email: 'coordenacao@lumeeducacao.org',
};

const SCREEN_TO_PATH: Record<AppScreen, string> = {
  landing: '/',
  sobre: '/sobre',
  login: '/login',
  app: '/app',
};

function parseScreenFromPath(pathname: string): AppScreen {
  if (pathname.startsWith('/sobre')) return 'sobre';
  if (pathname.startsWith('/login')) return 'login';
  if (pathname.startsWith('/app')) return 'app';
  return 'landing';
}

function AppContent({ initialScreen }: { initialScreen: AppScreen }) {
  const { snapshot, askLumiAssistant } = useLumeStore();

  const [screen, setScreen] = useState<AppScreen>(initialScreen);
  const [activeSection, setActiveSection] = useState<NavSectionId>('painel');
  const [lumiOpen, setLumiOpen] = useState(false);

  const navigate = useCallback((nextScreen: AppScreen) => {
    setScreen(nextScreen);
    if (typeof window !== 'undefined') {
      const nextPath = SCREEN_TO_PATH[nextScreen];
      if (window.location.pathname !== nextPath) {
        window.history.pushState({ screen: nextScreen }, '', nextPath);
      }
      window.scrollTo(0, 0);
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setScreen(parseScreenFromPath(window.location.pathname));
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLoginSuccess = (_profile: WorkspaceUserProfile) => {
    try {
      window.sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify(STANDARD_PROFILE)
      );
    } catch {
      // Ignore storage write errors
    }
    setActiveSection('painel');
    navigate('app');
  };

  const handleLogout = () => {
    setLumiOpen(false);
    try {
      window.sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // Ignore storage errors
    }
    navigate('landing');
  };

  return (
    <>
      {screen === 'landing' && (
        <LandingPage
          onNavigate={navigate}
          onOpenLumi={() => setLumiOpen(true)}
        />
      )}

      {screen === 'sobre' && <SobrePage onNavigate={navigate} />}

      {screen === 'login' && (
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onNavigate={navigate}
        />
      )}

      {screen === 'app' && (
        <AppShell
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          onLogout={handleLogout}
          lumiOpen={lumiOpen}
          onLumiOpenChange={setLumiOpen}
          hideFloatingLumi
        >
          {({ openLumi, openUpdateModal, showToast }) => (
            <Round1Demo
              activeSection={activeSection}
              onSelectSection={setActiveSection}
              openLumi={openLumi}
              openUpdateModal={openUpdateModal}
              showToast={showToast}
            />
          )}
        </AppShell>
      )}

      {/* Floating Lumi Assistant kept active across Public Layer and Workspace */}
      {screen !== 'login' && (
        <LumiAssistant
          isOpen={lumiOpen}
          onOpenChange={setLumiOpen}
          snapshot={snapshot}
          userName="João"
          onAskLumi={askLumiAssistant}
        />
      )}
    </>
  );
}

export function LumeAppClient({
  initialScreen = 'landing',
}: {
  initialScreen?: AppScreen;
}) {
  return (
    <ThemeProvider defaultTheme="dark">
      <LumeStoreProvider>
        <AppContent initialScreen={initialScreen} />
      </LumeStoreProvider>
    </ThemeProvider>
  );
}
