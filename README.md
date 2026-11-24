# Lume Educação — PMO, Dados e Copiloto IA (`ENGN62 — Grupo 4`)

Repositório oficial do projeto **Lume Educação** (Plataforma de estudos por assinatura para o ENEM, Feira de Santana/BA), reunindo modelagem de dados no Supabase, views SQL reativas, diagnósticos executivos, protótipo navegável e o Assistente de IA conectado em tempo real (`/api/chat`).

## Acesso em Produção
- **Aplicação do Assistente de IA (`LE-15` / `R13`):** https://lume-educacao.vercel.app
- **Painel de Telemetria do Agente:** `/telemetry`
- **Protótipo Navegável (`R12` / `D17`):** https://tocoamora-sousa.github.io/lume-educacao/

## Arquitetura do Assistente de IA (`LE-15`)
1. **Ingresso & Turnos Delta (`/api/chat` + `lume_agent`):**
   - `POST /api/chat` grava mensagens em `lume_agent.messages` e responde com ACK rápido (`202 Accepted`), agrupando rajadas de mensagens durante o debounce (`2,5s`) e encadeando **turnos delta** automaticamente caso novas mensagens cheguem durante a execução do turno ativo.
   - Suporta entrega assíncrona em múltiplas bolhas via `lume_agent.outbox_messages` (`GET /api/chat?conversationId=...`) e execução síncrona opcional (`POST /api/chat?sync=1`).
2. **Camada Determinística no Postgres (`lume_educacao`):**
   - **46 tabelas** saneadas com `13/13` controles `OK` (`vw_numeros_controle`).
   - **8 views de Fluxo Ágil/DORA (`M5`):** `sql/03_views_fluxo_agil_m5.sql`.
   - **5 views complementares:** `vw_evm_resumo`, `vw_riscos_reservas_alcadas`, `vw_piloto_okrs_resumo`, `vw_equipe_produtividade`, `vw_cenarios_base` + destravamento das constraints de data até `2027-12-31` para o Boletim Surpresa ao vivo (`sql/04_destrava_boletim_e_views_evm.sql`).
3. **RAG Vetorial Puro (`pgvector` + `gemini-embedding-2`):**
   - `lume_agent.knowledge_chunks` indexa `DICIONARIO.md`, todos os documentos de `docs/` e `G4 - Dossiê do grupo - Lume Educação.docx` em 1.536 dimensões (`sql/05_schema_lume_agent.sql`).
4. **Roteamento Agêntico & Cache & Telemetria:**
   - O modelo primário (`gemini-3.5-flash-lite`) decide autonomamente quando invocar `delegate_complex_analysis` para escalonar análises multi-frente ao `gemini-3.8-flash`.
   - Resultados de consultas e RAG são cacheados em `lume_agent.tool_cache` com `data_fingerprint` vivo (invalidação automática se novos dados entrarem no banco).
   - Ações de governança solicitadas no chat são gravadas em `lume_agent.agent_actions` com enquadramento automático na `05_matriz_alcadas`.
   - Cada turno registra métricas completas de latência, cache, tools e tokens em `lume_agent.turn_telemetry`.

## Como executar localmente
```bash
cp .env.example .env.local
# Preencher DATABASE_URL e GEMINI_API_KEY em .env.local

npm install
npm run test:gemini   # Valida gemini-3.5-flash-lite, gemini-3.8-flash e gemini-embedding-2
npm run ingest:rag    # Indexa DICIONARIO.md, docs/*.md e Dossiê no pgvector
npm run dev           # Sobe http://localhost:3000
```

## Contrato da API (`/api/chat`)
- `POST /api/chat` `{ "conversationId"?: string, "message": string, "sync"?: boolean }` → `202` `{ conversationId, jobId, state }` (ou `200` com `messages` quando `sync=true`).
- `GET /api/chat?conversationId=<uuid>` → `{ conversationId, isTyping, outbox, actions, liveStatus }`.
- `GET /api/telemetry` → `{ liveStatus, summary, turns, actions, ragDocs }`.
