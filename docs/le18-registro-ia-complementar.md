# Registro complementar de IA — LE-18

Registro produzido pelo assistente anterior; não comprova participação de três integrantes. Validar autoria e complementar com registros reais.

# Diário de prompts — Grupo 4 · Lume Educação

> Regra do enunciado: **dez entradas, de três pessoas** — o que pediram, o que a IA errou e como corrigiram.
> As entradas abaixo são de **uma pessoa** (tickets LE-34, LE-40 e LE-18, sessão de 24/11/2026 com o Claude).
> **Faltam entradas de pelo menos mais duas pessoas do grupo.** Copiem o modelo do fim do arquivo.

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

## Modelo para novas entradas

| # | Autor | Data | Ticket | O que foi pedido | O que a IA errou | Como foi corrigido / conferido |
|---|-------|------|--------|------------------|------------------|-------------------------------|
| 11 | | | | | | |
