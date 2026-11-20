# Qualidade dos Dados e Auditoria do Projeto Lume Educação (`ENGN62 — Grupo 4`)

O schema `lume_educacao` no Supabase (`diocwzrdrjyriaynarlw`) encontra-se íntegro e com **13/13 números de controle** reconciliados com o Dossiê nas duas datas de corte: **30/10/2026** (auditoria pós-saneamento) e **13/11/2026** (fechamento da quinzena de campo via boletins `B1` a `B10`).

## 1. Arquitetura do banco e histórico de migrations

O schema `lume_educacao` contém **46 tabelas**, **366 colunas** alinhadas ao `DICIONARIO.md` e à planilha `G4 - Base de dados - Lume Educação.xlsx`, somando **3.307 registros** após o fechamento de `13/11/2026` (`3.181` pós-saneamento até `30/10/2026` + `126` inserções da quinzena de campo).

| Versão | Nome da migration | Escopo principal |
| :--- | :--- | :--- |
| `20261120205844` | `create_remaining_29_lume_educacao_tables` | Criação das 29 tabelas complementares para completar as 46 tabelas do schema |
| `20261120211302` | `sanitize_lume_educacao_data_quality` | Saneamento histórico até `30/10/2026` (duplicatas, outliers 10×, carry-forwards e strings de status) |
| `20261120215446` | `fix_diversos_and_harden_lume_educacao_schema` | Apropriação dos 6 lançamentos `DIVERSOS`, tipagem de `duracao_fixa_du` (`integer`), +7 PKs, +15 FKs e 15 `CHECK`s |

A carga da quinzena de campo (`03` a `13/11/2026`) foi executada de forma transacional em [02_quinzena_campo_2026_11_13.sql](file:///C:/Users/Victor/.gemini/antigravity/scratch/lume-educacao/sql/02_quinzena_campo_2026_11_13.sql), preservando intactos os dados históricos até `30/10/2026` (exceto as atualizações estritas de estado da Sprint `S14` em `sprints`, `backlog_itens`, `defeitos` `DF-032` e `impedimentos` `IP-010` decorrentes dos boletins `B5`–`B7`).

---

## 2. Saneamento das anomalias históricas até `30/10/2026`

A auditoria independente do zero validou as quatro frentes de saneamento da migration `20261120211302`, tratou a quinta anomalia estrutural na migration `20261120215446` e preservou peculiaridades documentadas sem alterar o sentido dos fatos.

- **Duplicatas em `apontamento_horas`:** removidas **10 linhas duplicadas** da planilha bruta (`435 -> 425` linhas na data de corte `30/10/2026`).
- **Outliers de digitação 10× em `apontamento_horas`:** corrigidos os **3 registros** com zero excedente em semanas de `32h`/`40h`: `2026-06-22` / `P02` (`320 -> 32` h), `2026-08-24` / `P01` (`400 -> 40` h) e `2026-09-21` / `P16` (`400 -> 40` h).
- **Lacunas semanais com carry-forward em `avanco_semanal`:** confirmados os **5 registros** inseridos (`168 -> 173` informes até `30/10/2026`) por repetição do último avanço conhecido conforme o `DICIONARIO.md`:
  - `A06` em `2026-04-17`: `35%`, `EM_ANDAMENTO`, responsável `P05`;
  - `A10` em `2026-05-01`: `15%`, `EM_ANDAMENTO`, responsável `P06`;
  - `A23` em `2026-06-05`: `30%`, `EM_ANDAMENTO`, responsável `P08`;
  - `A20` em `2026-06-26`: `50%`, `EM_ANDAMENTO`, responsável `P08`;
  - `A24` em `2026-07-24`: `60%`, `EM_ANDAMENTO`, responsável `P08`.
- **Padronização textual de status e resultados:** normalizadas **21 strings** com erro tipográfico em `itens_transicoes` e **5 strings** em `inspecoes_aceite`.
- **Apropriação dos 6 lançamentos `DIVERSOS` em `custos_realizados` (`Convenção 6` — migration `20261120215446`):** a auditoria detectou `6` registros `PREDITIVA` (`R$ 92.574,73`) ainda gravados com `codigo_eap = 'DIVERSOS'` e `id_atividade = NULL`. Todos foram apropriados às suas atividades e contas EAP reais e reconciliados `6/6` contra o marco M3 (`25/09/2026`) do Dossiê:

| Lançamento | Data | Categoria | Atividade | EAP | Valor (R$) |
| :--- | :--- | :--- | :--- | :--- | ---: |
| `L00006` | `2026-03-30` | `SERVICO_CONTRATADO` | `A01` | `1.1.1` | 19.600,00 |
| `L00026` | `2026-04-30` | `SERVICO_CONTRATADO` | `A06` | `1.2.1` | 26.455,45 |
| `L00054` | `2026-06-11` | `SERVICO_CONTRATADO` | `A11` | `1.2.3` | 26.463,30 |
| `L00057` | `2026-06-19` | `OUTROS` | `A08` | `1.2.2` | 2.954,09 |
| `L00072` | `2026-07-20` | `OUTROS` | `A08` | `1.2.2` | 1.448,78 |
| `L00092` | `2026-08-31` | `SERVICO_CONTRATADO` | `A29` | `1.5.2` | 15.653,11 |
| **Total apropriado** | — | — | — | — | **92.574,73** |

**Reconciliação pós-apropriação no Marco M3 (`data <= 2026-09-25`, EAP nível 1 = `custos_realizados` `PREDITIVA` + mão de obra interna `ATIVIDADE`):**
- `1.1`: `111.571,06 + 25.785,00 = R$ 137.356,06` (`6/6` exato)
- `1.2`: `473.884,26 + 61.392,00 = R$ 535.276,26`
- `1.3`: `610.538,89 + 20.514,00 = R$ 631.052,89`
- `1.4`: `394.331,39 + 53.124,00 = R$ 447.455,39`
- `1.5`: `124.890,40 + 39.240,00 = R$ 164.130,40`
- `1.6`: `5.076,56 + 3.576,00 = R$ 8.652,56`

**Peculiaridades documentais preservadas sem alteração:**
- `reunioes`: `RE-020` e `RE-031` mantêm `convidados = 12` e `presentes = 13` (presença superior à lista original).
- `sprints` e `calendario`: `sprints` registra `S01` a `S17` (com `S15`, `S16` e `S17` futuras sem registros em `sprint_itens`), enquanto `calendario.id_sprint` também referencia `S18` a `S21`.
- `cenarios`: o cenário `C6` mantém `id_atividade_gatilho = 'N05'` (identificador de atividade de cenário não cadastrada na tabela `atividades` do plano base).

---

## 3. Integridade estrutural e melhorias residuais recomendadas

Após a migration `20261120215446`, todas as **46 tabelas** possuem chave primária, não há colunas de data armazenadas como `text`, e as restrições referenciais e de domínio estão ativas no banco.

| Controle estrutural | Estado verificado | Observação |
| :--- | :---: | :--- |
| Tabelas no schema `lume_educacao` | **46** | Todas cobertas pelo `DICIONARIO.md` |
| Colunas totais | **366** | Correspondência completa com os cabeçalhos da planilha |
| Chaves primárias (`PRIMARY KEY`) | **46** | +7 PKs adicionadas na migration `20261120215446` |
| Chaves estrangeiras (`FOREIGN KEY`) | **61** | +15 FKs adicionadas; mantidos `cenarios.id_atividade_gatilho` e `calendario.id_sprint` sem FK por `N05` e `S18`–`S21` |
| Restrições `CHECK` | **15** | Corte temporal (`<= 2026-11-13`) e domínios de enum aplicados |
| Colunas de data em `text` | **0** | Todas convertidas para `date` |
| Tipagem de `atividades.duracao_fixa_du` | `integer` | Convertida de `text` na migration `20261120215446` |

**Melhorias residuais registradas nos advisors do Supabase (não bloqueantes para entrega):**
1. **Conversão monetária (`float8 -> numeric(12,2)`):** permanecem **24 colunas** com sufixo `*_rs` em `double precision` (`float8`); recomenda-se converter para `numeric(12,2)` em janela futura de refatoração.
2. **Políticas RLS (`rls_enabled_no_policy`):** todas as **46 tabelas** estão com RLS habilitado e **0 políticas** definidas (`security advisor: 46`), adequadas apenas para acesso privilegiado (`service_role`/MCP); é necessário criar políticas explícitas de leitura caso painéis ou usuários finais consultem via `anon`/`authenticated`.
3. **Índices em chaves estrangeiras (`unindexed_foreign_keys`):** o performance advisor sinaliza **50 ocorrências** de FKs sem índice dedicado (`COUNT` total no catálogo = `55`), ponto recomendável antes de escalar consultas analíticas concorrentes.

---

## 4. Fechamento da quinzena de campo (`03` a `13/11/2026`)

O script [02_quinzena_campo_2026_11_13.sql](file:///C:/Users/Victor/.gemini/antigravity/scratch/lume-educacao/sql/02_quinzena_campo_2026_11_13.sql) aplicou **126 inserções** e **14 atualizações** distribuídas pelos boletins **B1 a B10**:

- **B1 (`avanco_semanal`):** `+4` linhas (`A18` concluída em `05/11`, `A27` concluída em `13/11` e `A19` em `80%`).
- **B2 (`apontamento_horas`):** `+22` linhas (`+324,0 h` na semana de `02/11` e `+409,5 h` na semana de `09/11`, somando `+733,5 h`).
- **B3 (`contratos_medicoes` e `custos_realizados`):** `+1` medição (`MED-CT06-04`, aprovada em `05/11`) e `+5` lançamentos (`L00119` a `L00123`, totalizando `+R$ 66.381,00`, dos quais `+R$ 7.529,70` em `PREDITIVA`).
- **B4 (`inspecoes_aceite`):** `+2` inspeções (`IN-071` e `IN-072`).
- **B5 (`sprints`, `backlog_itens`, `sprint_itens`, `defeitos`):** atualização da `S14` (`pessoas_dia_disponiveis = 27`, `horas_extras_autorizadas = 'NAO'`, meta `"Avançar o épico Tutor com IA"`), `+7` novos itens (`LU-235` a `LU-241`), `+13` vínculos em `sprint_itens`, `+5` defeitos (`DF-033` a `DF-037`) e encerramento de `DF-032` (`2026-11-05`).
- **B6 (`itens_transicoes` e `backlog_itens`):** `+25` transições (`T00425` a `T00449`) e atualização de estado dos `11` itens pré-existentes alocados na `S14`.
- **B7 (`impedimentos` e `implantacoes`):** `+2` impedimentos (`IP-011` e `IP-012`), encerramento de `IP-010` (`2026-11-05`, `7 du`) e `+5` implantações (`IMP-051` a `IMP-055`).
- **B8 (`riscos` e `mudancas`):** `0` registros na quinzena, conforme declarado no boletim.
- **B9 (`reunioes`, `engajamento_mensal`, `pulso_equipe`, `okr_medicoes`):** `+6` reuniões (`RE-081` a `RE-086`), `+13` avaliações de engajamento de novembro (`2026-11-01`), `+1` pulso de equipe (`S14`: nota `4,12` com `5` respostas) e `+12` medições de OKR.
- **B10 (`producao_semanal` e `funil_piloto_semanal`):** `+1` informe de produção (`A18` em `06/11`, `81,0` unidades e `+175` Hh) e `+2` semanas do funil piloto (`02/11` e `09/11`).

**Regras de rastreabilidade adotadas (sem invenção de valores):**
1. **`valor_de_negocio` e `ordem_no_backlog`:** o boletim `B5` não fornece esses campos para `LU-235` a `LU-241`; ambos foram gravados como `NULL`.
2. **Títulos truncados dos 5 bugs (`LU-236`–`LU-241`):** reconstruídos literalmente a partir do título do item de origem na tabela `defeitos` (`LU-148`, `LU-225` e `LU-150`), sem presumir sintomas adicionais.
3. **Separação de datas nas 12 medições de OKR (`B9`):** os boletins apresentam dois valores consecutivos por KR sem coluna explícita de data no anexo; o primeiro registro de cada par foi datado em `2026-10-31` (comprovado pelo funil de outubro: `974` ativos, `NPS 52`, `48,0%` ativação e `6,6` chamados/100) e o segundo em `2026-11-13` (`1.085` ativos, `NPS 46`, `56,5%` ativação e `4,7` chamados/100).

### Batimento dos 13 números de controle (`30/10/2026` x `13/11/2026`)

| # | Tabela / Métrica | Corte `30/10/2026` | Meta Dossiê `13/11/2026` | Supabase `13/11/2026` | Situação |
| :-: | :--- | :---: | :---: | :---: | :---: |
| 1 | Tab. 18 (`apontamento_horas`) — Horas totais | `12.359,0` | `13.092,5` | `13.092,5` | OK |
| 2 | Tab. 18 (`apontamento_horas`) — Linhas | `425` | `447` | `447` | OK |
| 3 | Tab. 19 (`custos_realizados`) — Total (R$) | `2.271.592,42` | `2.337.973,42` | `2.337.973,42` | OK |
| 4 | Tab. 19 (`custos_realizados`) — Preditiva (R$) | `1.883.836,07` | `1.891.365,77` | `1.891.365,77` | OK |
| 5 | Tab. 19 (`custos_realizados`) — Lançamentos | `118` | `123` | `123` | OK |
| 6 | Tab. 14 (`backlog_itens`) — Itens totais | `134` | `141` | `141` | OK |
| 7 | Tab. 14 (`backlog_itens`) — Concluídos | `95` | `100` | `100` | OK |
| 8 | Tab. 14 (`backlog_itens`) — Pontos concluídos | `289` | `306` | `306` | OK |
| 9 | Tab. 21 (`itens_transicoes`) — Transições | `424` | `449` | `449` | OK |
| 10 | Tab. 17 (`avanco_semanal`) — Informes | `173` | `177` | `177` | OK |
| 11 | Tab. 42 (`producao_semanal`) — Hh acumuladas | `5.338` | `5.513` | `5.513` | OK |
| 12 | Tab. 42 (`producao_semanal`) — Linhas | `43` | `44` | `44` | OK |
| 13 | Tab. 39 (`cargos_salarios`) — Folha mensal (R$)* | `288.603,60` | `288.603,60` | `288.603,60` | OK |

*\*Fórmula da folha mensal na Tab. 39: `SUM(remuneracao_mensal_rs * (1 + encargos_pct / 100) + beneficios_mensais_rs)` = `R$ 288.603,60` (`remuneracao_mensal_rs` isolada = `R$ 169.850,00`).*

**Verificações adicionais pós-carga (`13/11/2026`):**
- **Velocidade da Sprint `S14`:** `17` pontos concluídos de `52` pontos comprometidos (`sprint_itens`).
- **Consistência de status:** **0 divergências** entre `backlog_itens.status` e a última transição de cada item em `itens_transicoes`.
- **Contagens operacionais pós-carga:** `contratos_medicoes = 56`, `inspecoes_aceite = 72`, `defeitos = 37` (`DF-032` resolvido em `2026-11-05`), `impedimentos = 12` (`IP-010` fechado em `2026-11-05`), `implantacoes = 55`, `reunioes = 86`, `engajamento_mensal = 117`, `pulso_equipe = 14`, `okr_medicoes = 34`, `funil_piloto_semanal = 14`, `sprint_itens = 189`.

---

## 5. Espelhamento da Sprint `S14` no Jira (`LU`)

O produto foi espelhado no projeto Scrum **`LU`** ([Board 35](https://victorjmello7.atlassian.net/jira/software/projects/LU/boards/35)), com **8 épicos**, **13 itens na Sprint S14 ativa** (`id: 38`) e **5 bugs no backlog**, conforme detalhado em [jira-s14-mapa.md](file:///C:/Users/Victor/.gemini/antigravity/scratch/lume-educacao/docs/jira-s14-mapa.md).
