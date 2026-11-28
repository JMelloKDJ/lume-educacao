# Registro complementar de IA — LE-18

Registro complementar do diário de prompts do Grupo 4. Validar autoria final e completar com registros de pelo menos mais um integrante do grupo antes da submissão oficial.

# Diário de prompts — Grupo 4 · Lume Educação

> Regra do enunciado: **dez entradas, de três pessoas** — o que pediram, o que a IA errou e como corrigiram.
> As entradas abaixo reúnem registros de **duas pessoas** (**Jorge Junior**, entradas 1–10; **João Victor Mello**, entradas 11–16).
> **Falta registrar entradas de pelo menos mais uma pessoa do grupo.** Copiem o modelo do fim do arquivo.

| # | Autor | Data | Ticket | O que foi pedido | O que a IA errou | Como foi corrigido / conferido |
|---|-------|------|--------|------------------|------------------|-------------------------------|
| 1 | Jorge Junior | 24/11/2026 | LE-40 | Calcular o término dos cenários pela convenção 11 | Na primeira versão, a data prevista da Release 2 no C3 caía em 25/12 (Natal) e foi empurrada para o dia útil **seguinte**; o C3 deu 29/03/2027 em vez de 25/03/2027 | Regra trocada para o último dia útil **da** sprint (`fn_fim_sprint`); C1, C3 e C4 passaram a bater com a folha M7 |
| 2 | Jorge Junior | 24/11/2026 | LE-18 | Tratar os CSVs e conferir os números de controle | A varredura de status só olhou as tabelas 25 e 14 e deixou passar 21 transições com "Concluído", "DONE", "Em andamento" etc. na tabela 21 | O teste do CFD fechou com 136 itens em vez de 141; a padronização da tabela 21 entrou no script e o teste passou |
| 3 | Jorge Junior | 24/11/2026 | LE-34 | View do CFD diário | A primeira versão usava subconsulta correlacionada por dia e item e levava 3,3 s | Reescrita com `lead()` (intervalos de status por item); mesma resposta, conferida pelo teste |
| 4 | Jorge Junior | 24/11/2026 | LE-34 | Migrações 2.7 a 2.10 | Uma view da 2.7 chamava uma função criada só na migração 2.10 (ordem de execução errada) | Função movida para a migração de base; as migrações rodam do zero nos testes |
| 5 | Jorge Junior | 24/11/2026 | LE-34 | View de impacto do reajuste (convenção 19) | A view foi criada antes da função de simulação de que depende | Movida para a migração 0700, que reúne as views que dependem da previsão da rede |
| 6 | Jorge Junior | 24/11/2026 | LE-40 | Motor de cenários em SQL | Primeiro desenho previa tabelas temporárias, que falhariam no GET do PostgREST (transação somente leitura) | Motor reescrito com arrays e jsonb dentro da função, sem escrita |
| 7 | Jorge Junior | 24/11/2026 | LE-34 | Modo local do front com Postgres no navegador | O build do Next falhou ao empacotar o PGlite (módulos `node:`) | PGlite servido como arquivo estático em `public/pglite` e importado em tempo de execução |
| 8 | Jorge Junior | 24/11/2026 | LE-34 | Atualização automática após CRUD | Leituras via RPC disparavam o aviso de mudança e entravam em laço de releitura | Aviso só em RPC que grava (`mutacao = true`), como `fn_mover_cartao` |
| 9 | Jorge Junior | 24/11/2026 | LE-34 | Curva S no dashboard | O último ponto aparecia como 30/11/2026, depois da data de status | Data de referência limitada à data de status (13/11/2026) |
| 10 | Jorge Junior | 24/11/2026 | LE-34 | Conferir as telas no navegador | Valores grandes ficavam em fonte serifada (faltava fonte de reserva quando o Google Fonts não carrega) | Fontes de reserva adicionadas; telas revistas em captura de tela |
| 11 | João Victor Mello | 26–28/11/2026 | LE-26 / LE-13 | Projetar o design completo da plataforma no Figma (tokens, camada pública, workspace e 15 mockups `T00`–`T14`) | A primeira versão ficou genérica, despejando dados de relatório e jargões acadêmicos nas telas e misturando sidebar escura com fundo branco | Redesenho direcionado para produto SaaS com temas Claro e Escuro separados, títulos curtos e criação do assistente flutuante `Lumi` |
| 12 | João Victor Mello | 26–28/11/2026 | LE-13 / LE-26 | Ajustar Landing Page, cards, sidebar e alternância de tema no Figma | A equipe estava na mesma seção da Landing, os cards tinham tamanhos diferentes, `Base de Dados` aparecia isolado, a sidebar era fixa e o toggle Claro/Escuro ficava na barra lateral | Equipe movida para a aba `Sobre Nós`, cards padronizados no mesmo tamanho, sidebar tornada retrátil e toggle Claro/Escuro movido para o cabeçalho superior |
| 13 | João Victor Mello | 28/11/2026 | LE-37 | Construir o Mapa 3D Operacional isométrico com 28 blocos em 4 ilhas e linha do tempo (`Jul 26`–`Mar 27`) | O protótipo inicial trazia um placeholder estático ("Mapa Territorial 3D · Polos da Bahia") sem as 4 ilhas nem dependências interativas | Implementado palco SVG isométrico com zoom/pan, busca, filtros, dependências tracejadas e painel lateral sincronizado (`src/data/mapa3dData.ts`) |
| 14 | João Victor Mello | 28/11/2026 | LE-12 / LE-14 | Auditar interatividade, estado compartilhado, responsividade e fallback sem `.env` do Supabase | Sliders de premissas em `CenariosPage` e controles de `PainelGeralPage` não recalculavam nem atualizavam o estado global, e havia risco de erro sem variáveis de ambiente | Estado unificado em `src/services/lumeStore.ts` com fallback em memória/`localStorage`, recálculo em tempo real dos sliders/cenários e toasts estilizados |
| 15 | João Victor Mello | 28/11/2026 | LE-37 / LE-36 / LE-13 | Refinar Mapa 3D (visão atômica), Matriz de Riscos 5×5 + OKRs e Carrossel 3D de Produto | Mapa 3D abria modal de texto em vez de drill-down 3D; `Riscos & Metas` tinha severidade incoerente com `P × I` (score 16 marcado como `ALTO`), KPI `100%` irreal e sobreposição do Lumi; Carrossel 3D tinha setas no topo e mockup pequeno | Criada visão atômica em 2 níveis dentro do próprio palco 3D com breadcrumb, aplicada regra estrita `P × I` + `pb-24` contra sobreposição do Lumi, e movidas as setas para as laterais com palco ampliado (`ProductCoverflowShowcase.tsx`) |
| 16 | João Victor Mello | 28/11/2026 | LE-38 | Implementar Rede PERT/CPM e Simulador de Crashing em `CronogramaPage.tsx` alinhados à view `vw_rede_pert_cpm` | Sem recálculo completo do grafo ao comprimir atividades, a duração total e a mudança de caminho crítico ficavam inconsistentes | Implementado motor determinístico `calcularRedePertCpm` (Forward/Backward Pass, `FT`, `FL` e `Cost Slope`) recalculando a rede inteira a cada passo de Crashing |

## Modelo para novas entradas

| # | Autor | Data | Ticket | O que foi pedido | O que a IA errou | Como foi corrigido / conferido |
|---|-------|------|--------|------------------|------------------|-------------------------------|
| 17 | | | | | | |
