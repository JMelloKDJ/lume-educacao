'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Clock,
  HelpCircle,
  Mic,
  Paperclip,
  SendHorizontal,
  Shield,
  SlidersHorizontal,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  LUMI_QUICK_PROMPTS,
  generateLumiFallbackReply,
  type CutoffSnapshot,
} from '../../data/mock-project';
import { cn } from '../../lib/utils';
import { LumiMascot } from './lumi-mascot';

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
}

interface LumiAssistantProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  snapshot: CutoffSnapshot;
  userName?: string;
  onAskLumi?: (prompt: string) => Promise<string>;
}

function formatNow(): string {
  const now = new Date();
  return now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function PromptIcon({ icon }: { icon: (typeof LUMI_QUICK_PROMPTS)[number]['icon'] }) {
  switch (icon) {
    case 'trending':
      return <TrendingUp className="h-3.5 w-3.5 text-[var(--brand-primary)] shrink-0" />;
    case 'clock':
      return <Clock className="h-3.5 w-3.5 text-[var(--brand-primary)] shrink-0" />;
    case 'shield':
      return <Shield className="h-3.5 w-3.5 text-[var(--brand-primary)] shrink-0" />;
    case 'sliders':
      return <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--brand-primary)] shrink-0" />;
    case 'help':
      return <HelpCircle className="h-3.5 w-3.5 text-[var(--brand-primary)] shrink-0" />;
  }
}

export function LumiAssistant({
  isOpen,
  onOpenChange,
  snapshot,
  userName = 'João',
  onAskLumi,
}: LumiAssistantProps) {
  const [bubbleDismissed, setBubbleDismissed] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [contextAttached, setContextAttached] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content: `Oi, ${userName}! Eu sou o Lumi, assistente da Lume. Com o que você precisa de ajuda?`,
      timestamp: formatNow(),
    },
  ]);

  const scrollEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      const timer = window.setTimeout(() => {
        inputRef.current?.focus();
      }, 180);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen, messages, isSending]);

  const sendMessage = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed || isSending) return;

    const finalPrompt = contextAttached
      ? `[Corte ${snapshot.label}] ${trimmed}`
      : trimmed;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: formatNow(),
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInputValue('');
    setIsSending(true);

    let replyText = '';

    if (onAskLumi) {
      try {
        replyText = await onAskLumi(finalPrompt);
      } catch {
        replyText = '';
      }
    }

    if (!replyText) {
      await new Promise((resolve) => window.setTimeout(resolve, 320));
      replyText = generateLumiFallbackReply(trimmed, snapshot);
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: replyText,
        timestamp: formatNow(),
      },
    ]);
    setIsSending(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(inputValue);
  };

  const handleVoiceShortcut = () => {
    setInputValue(`Qual o panorama do corte ${snapshot.label}?`);
    inputRef.current?.focus();
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50 flex max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-2.5rem)] flex-col items-end gap-2.5 sm:flex-row sm:items-end sm:gap-3 pointer-events-none">
      {/* Expanded Chat Panel anchored beside/above Lumi */}
      <AnimatePresence>
        {isOpen && (
          <motion.section
            key="lumi-chat-panel"
            aria-label="Chat com o assistente Lumi"
            initial={{ opacity: 0, y: 18, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'pointer-events-auto flex w-[min(calc(100vw-2rem),372px)] sm:w-[min(calc(100vw-6.5rem),372px)] max-h-[min(74vh,560px)] flex-col overflow-hidden rounded-[22px] border border-[var(--border-brand)] bg-[var(--bg-surface)] dark:bg-[var(--bg-sidebar)] shadow-[var(--shadow-lumi)]'
            )}
          >
            {/* Header */}
            <header className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  <LumiMascot size="sm" trackMouse={false} />
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[var(--bg-surface)] dark:border-[var(--bg-sidebar)] bg-[var(--status-positive)]"
                  />
                </div>
                <div className="min-w-0">
                  <h2 className="font-[var(--font-display)] text-sm font-bold leading-tight text-[var(--text-primary)]">
                    Lumi
                  </h2>
                  <p className="text-[11px] text-[var(--text-muted)] leading-tight mt-0.5">
                    Assistente da Lume
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-positive)]" />
                  Online agora
                </span>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  aria-label="Fechar assistente Lumi"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/40 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            {/* Messages & Quick Shortcuts */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5">
              {messages.map((msg, index) => (
                <div key={msg.id} className="space-y-3">
                  <div
                    className={cn(
                      'flex flex-col',
                      msg.role === 'user' ? 'items-end' : 'items-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[92%] rounded-2xl px-3.5 py-3 text-[13px] leading-relaxed',
                        msg.role === 'user'
                          ? 'bg-[var(--brand-primary)] text-white rounded-br-md'
                          : 'border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-bl-md'
                      )}
                    >
                      <p>{msg.content}</p>
                      <div
                        className={cn(
                          'mt-1.5 text-right font-mono text-[10px] tabular-nums',
                          msg.role === 'user' ? 'text-white/75' : 'text-[var(--text-muted)]'
                        )}
                      >
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>

                  {/* Quick shortcut pills right below the greeting */}
                  {index === 0 && (
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      {LUMI_QUICK_PROMPTS.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          disabled={isSending}
                          onClick={() => void sendMessage(item.label)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-brand)]/70 bg-[var(--bg-surface)] dark:bg-[var(--bg-surface)]/80 px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary-soft)] disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/40"
                        >
                          <PromptIcon icon={item.icon} />
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isSending && (
                <div className="flex items-start">
                  <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-primary)] animate-bounce [animation-delay:-0.25s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-primary)] animate-bounce [animation-delay:-0.12s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-primary)] animate-bounce" />
                  </div>
                </div>
              )}

              <div ref={scrollEndRef} />
            </div>

            {/* Footer Input Pill */}
            <div className="px-4 pb-3.5 pt-2">
              {contextAttached && (
                <div className="mb-2 flex items-center justify-between rounded-lg bg-[var(--brand-primary-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--brand-primary)]">
                  <span>Contexto anexado: {snapshot.fullLabel}</span>
                  <button
                    type="button"
                    onClick={() => setContextAttached(false)}
                    aria-label="Remover contexto"
                    className="ml-2 hover:opacity-75 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2 rounded-full border border-[var(--border-brand)]/75 bg-[var(--bg-elevated)]/70 dark:bg-[var(--bg-surface)]/75 px-3 py-1.5 focus-within:border-[var(--brand-primary)] focus-within:ring-2 focus-within:ring-[var(--brand-primary)]/20 transition-all"
              >
                <button
                  type="button"
                  onClick={() => setContextAttached((prev) => !prev)}
                  title={
                    contextAttached
                      ? 'Contexto do corte atual anexado'
                      : `Anexar corte ${snapshot.label}`
                  }
                  aria-label={`Anexar contexto do corte ${snapshot.label}`}
                  className={cn(
                    'inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors cursor-pointer shrink-0',
                    contextAttached
                      ? 'bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  )}
                >
                  <Paperclip className="h-3.5 w-3.5" />
                </button>

                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Pergunte qualquer coisa pro Lumi..."
                  className="w-full bg-transparent text-xs sm:text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
                />

                {inputValue.trim() ? (
                  <button
                    type="submit"
                    disabled={isSending}
                    aria-label="Enviar mensagem"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-primary)] text-white transition-colors hover:bg-[var(--brand-primary-hover)] disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    <SendHorizontal className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleVoiceShortcut}
                    title="Inserir pergunta sugerida"
                    aria-label="Sugerir pergunta rápida"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] transition-colors hover:bg-[var(--brand-primary-soft-hover)] cursor-pointer shrink-0"
                  >
                    <Mic className="h-3.5 w-3.5" />
                  </button>
                )}
              </form>

              <p className="mt-2 text-center text-[11px] text-[var(--text-muted)]">
                O Lumi analisa o projeto e resume cenários em segundos.
              </p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Minimized Speech Bubble (hidden when chat is open) */}
      <AnimatePresence>
        {!isOpen && !bubbleDismissed && (
          <motion.div
            key="lumi-speech-bubble"
            initial={{ opacity: 0, x: 14, scale: 0.94 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.94 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto relative flex max-w-[260px] sm:max-w-[286px] items-start gap-2.5 rounded-2xl border border-[var(--border-brand)]/75 bg-[var(--bg-surface)] px-4 py-3 shadow-[var(--shadow-lumi-bubble)]"
          >
            <button
              type="button"
              onClick={() => onOpenChange(true)}
              className="text-left text-xs sm:text-[13px] leading-snug text-[var(--text-primary)] cursor-pointer focus-visible:outline-none"
            >
              Oi! Eu sou o Lumi, assistente da Lume. Precisa de ajuda? É só clicar em mim.
            </button>
            <button
              type="button"
              onClick={() => setBubbleDismissed(true)}
              aria-label="Dispensar balão de boas-vindas"
              className="inline-flex h-5 w-5 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] shrink-0 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Lumi Mascot Button (kept shrink-0 with safe right margin inside fixed container) */}
      <motion.button
        type="button"
        onClick={() => onOpenChange(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isOpen ? 'Minimizar assistente Lumi' : 'Abrir assistente Lumi'}
        aria-expanded={isOpen}
        className="pointer-events-auto relative inline-flex h-[66px] w-[66px] shrink-0 items-center justify-center rounded-full pr-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/50 cursor-pointer"
      >
        <LumiMascot size="md" trackMouse />
      </motion.button>
    </div>
  );
}
