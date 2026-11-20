# Memória de Cálculo Validada M5, Fluxo Ágil, DORA e Views Reativas — Lume Educação (`ENGN62 — Grupo 4`)

A entrega **`LE-33` (EAP `2.7`)** consolida as métricas de fluxo ágil e qualidade operacional da **Lume Educação** nos dois cortes oficiais (**`30/10/2026`** para a folha manuscrita **`M5`** e **`13/11/2026`** para **`D7` / `D8` / `R7` / `R8`**), implementadas em **8 views SQL reativas** no schema `lume_educacao` ([03_views_fluxo_agil_m5.sql](file:///C:/Users/Victor/.gemini/antigravity/scratch/lume-educacao/sql/03_views_fluxo_agil_m5.sql)), com **13/13 números de controle** preservados e **100% de batimento** com o quadro `LU` (`Board 35`, `Sprint 38`) no Jira Cloud.

---

## 1. Convenções adotadas e prova cruzada com o caso (`C1`)

Todas as fórmulas seguem o [DICIONARIO.md](file:///C:/Users/Victor/.gemini/antigravity/scratch/lume-educacao/DICIONARIO.md#L801-L825) e as três definições operacionais aprovadas para a camada SQL:

1. **Escopo DORA na view consolidada (`vw_fluxo_agil_dora`):** padrão **`PRODUCAO`** com frequência por semanas ágeis encerradas (`impl_producao_total / (sprints_encerradas * 2)`), conforme Convenção 13; a view `vw_dora_qualidade` preserva também o recorte **`TODOS`** (homologação + produção) e a frequência pós-R1 (desde `07/08/2026`).
2. **Burndown padrão (`vw_burndown_diario`):** coluna principal **`pts_restantes_estatico`** (total comprometido da sprint menos pontos concluídos até o dia, conforme enunciado literal da folha `M5`), expondo **`pts_restantes_dinamico`** em paralelo para itens `ADICIONADO_DURANTE` pela data de criação.
3. **Lead Time e Cycle Time (`vw_lead_cycle_time_itens`):** contagem inclusiva de dias úteis (`calendario.dia_util = 1`) em `[data_inicio, data_conclusao]` (Cycle Time) e `[data_criacao, data_conclusao]` (Lead Time), evitando `NULL` nos `19` itens concluídos que foram criados em fim de semana ou feriado.

**Prova de consistência contra o cenário base `C1` (folha `M7`):** em `13/11/2026`, `R2` acumula `64` pts restantes (`!= WONT`) e velocidade média móvel de `18,60` pts/sprint (`S10`–`S14`), projetando `CEIL(64 / 18,60) = 4` sprints restantes → término de `A41` na **`S18` (`08/01/2027`, `du 208`)**. Somando o caminho crítico pós-`A41` (`A32 [8] -> A33 [6] -> A35 [11] -> A36 [30] -> A39 [6] = 61 du`), obtém-se exatamente **`du 269` = `08/04/2027`** (`+46 du` além do término contratual `29/01/2027`, `du 223`), idêntico ao controle de `C1` no Dossiê.

---

## 2. Gabarito pronto para transcrição da folha manuscrita `M5` (`S13` em `30/10/2026`)

A Sprint **`S13`** transcorreu de **`19/10/2026` a `30/10/2026`** (**`10` dias úteis**, sem feriados) com **`10` itens** e **`41` pontos comprometidos** (`16` de transbordo, `19` de planejamento e `6` adicionados durante).

### 2.1 Quadro de indicadores resumidos da `M5` (`30/10/2026`)

| Indicador exigido na `M5` | Valor | Memória de cálculo |
| :--- | :---: | :--- |
| Pontos comprometidos na `S13` | **41 pts** (`10` itens) | `5 + 8 + 3 + 3 + 3 + 5 + 3 + 5 + 5 + 1` |
| Velocidade da `S13` (concluídos) | **22 pts** (`5` itens) | `LU-225 (8) + LU-232 (3) + LU-150 (3) + LU-149 (5) + LU-151 (3)` (`53,7%`) |
| Pontos não concluídos na `S13` | **19 pts** (`5` itens) | `41 - 22` (`LU-152`, `LU-153`, `LU-154`, `LU-233`, `LU-234`) |
| Velocidade média 5 últimas (`S09`–`S13`) | **17,80 pts/sprint** | `(13 + 4 + 32 + 18 + 22) / 5 = 89 / 5` |
| Pontos restantes `R2` em `30/10` (`!= WONT`) | **64 pts** (`15` itens) | `R1 = 0` pts; `R2 = 1` MUST + `37` SHOULD + `26` COULD |
| Previsão de sprints restantes p/ `R2` em `30/10` | **4 sprints (`S17`)** | `CEIL(64 / 17,80) = CEIL(3,5955) = 4` → `S17` (`25/12/2026`; último du `24/12`, `du 199`) |
| Tempo de ciclo médio (`S13`, `n = 5`) | **8,00 du** | `(10 + 7 + 5 + 9 + 9) / 5 = 40 / 5` |
| Vazão (`Throughput`) da `S13` | **0,50 itens/du** | `5 itens / 10 du` (`2,50 itens/semana`) |
| WIP médio — Lei de Little (`vazão × CT`) | **4,00 itens** | `0,50 × 8,00` (WIP diário médio observado via CFD: `4,20 itens`) |

### 2.2 Detalhamento dos `10` itens da Sprint `S13`

| Item | Pontos | Entrada na sprint | Criação | Início | Conclusão | Cycle Time (du) | Lead Time (du) | Rev. par |
| :--- | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `LU-149` | 5 | `TRANSBORDO` | 27/04/2026 | 16/10/2026 | 28/10/2026 | **9** | 127 | `1` (sim) |
| `LU-225` | 8 | `TRANSBORDO` | 17/09/2026 | 07/10/2026 | 21/10/2026 | **10** | 24 | `0` (não) |
| `LU-232` | 3 | `TRANSBORDO` | 14/10/2026 | 14/10/2026 | 22/10/2026 | **7** | 7 | `1` (sim) |
| `LU-150` | 3 | `PLANEJAMENTO` | 26/04/2026 | 19/10/2026 | 23/10/2026 | **5** | 124 | `1` (sim) |
| `LU-151` | 3 | `PLANEJAMENTO` | 17/04/2026 | 20/10/2026 | 30/10/2026 | **9** | 134 | `0` (não) |
| `LU-152` | 5 | `PLANEJAMENTO` | 26/04/2026 | 20/10/2026 | — *(11/11)* | — | — | `0` (na `S14`) |
| `LU-153` | 3 | `PLANEJAMENTO` | 25/04/2026 | 27/10/2026 | — *(05/11)* | — | — | `0` (na `S14`) |
| `LU-154` | 5 | `PLANEJAMENTO` | 23/04/2026 | 04/11/2026 | — *(em curso)* | — | — | — |
| `LU-233` | 5 | `ADICIONADO_DURANTE` | 23/10/2026 | 26/10/2026 | — *(04/11)* | — | — | `0` (na `S13`) |
| `LU-234` | 1 | `ADICIONADO_DURANTE` | 29/10/2026 | 03/11/2026 | — *(05/11)* | — | — | `0` (na `S14`) |

### 2.3 Burndown diário da Sprint `S13` (`vw_burndown_diario`)

| Dia | Data | Concluído no dia | Pontos concluídos (acum.) | Restante M5 (estático) | Restante dinâmico | Linha ideal (fim do dia) | Desvio vs. ideal | WIP observado (CFD) |
| :-: | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| 0 | Início | — | 0 | **41** | 35 | **41,00** | 0,00 | — |
| 1 | 19/10 (seg) | — | 0 | **41** | 35 | **36,90** | +4,10 | 4 |
| 2 | 20/10 (ter) | — | 0 | **41** | 35 | **32,80** | +8,20 | 6 |
| 3 | 21/10 (qua) | `LU-225(8)` | 8 | **33** | 27 | **28,70** | +4,30 | 5 |
| 4 | 22/10 (qui) | `LU-232(3)` | 11 | **30** | 24 | **24,60** | +5,40 | 4 |
| 5 | 23/10 (sex) | `LU-150(3)` | 14 | **27** | 26 | **20,50** | +6,50 | 3 |
| 6 | 26/10 (seg) | — | 14 | **27** | 26 | **16,40** | +10,60 | 4 |
| 7 | 27/10 (ter) | — | 14 | **27** | 26 | **12,30** | +14,70 | 5 |
| 8 | 28/10 (qua) | `LU-149(5)` | 19 | **22** | 21 | **8,20** | +13,80 | 4 |
| 9 | 29/10 (qui) | — | 19 | **22** | 22 | **4,10** | +17,90 | 4 |
| 10 | 30/10 (sex) | `LU-151(3)` | 22 | **19** | 19 | **0,00** | +19,00 | 3 |

---

## 3. Série histórica `S01`–`S14`, Burndown `S14`, CFD, Previsão de Releases e Revisão por Par (`13/11/2026`)

Na Sprint **`S14`** (`02/11` a `13/11/2026`, `9 du`), o time entregou `17` de `52` pts comprometidos (`32,7%`), atingindo **`306` pts e `100` itens concluídos acumulados**. Como entraram `17` pts novos em `R2` (`11` pts de pedidos diretos fora do controle de mudanças + `6` pts de `5` novos bugs), o saldo de `R2` permaneceu em **`64` pts**, empurrando a previsão de `R2` de `S17` (`25/12/2026`) para **`S18` (`08/01/2027`, `du 208`)**.

### 3.1 Velocidade, MM5, Vazão, Cycle/Lead Time, WIP e Revisão por Par (`vw_velocidade_sprints`)

| Sprint | du | Comp. (pts) | Plan / Transb / Adic | Veloc. (pts) | Taxa (%) | Acum. (pts / itens) | MM5 (pts) | Vazão (itens/du) | CT méd. (du) | LT méd. (du) | WIP Little | WIP obs. méd. | Rev. par (`EM_REVISAO`) |
| :---: | :-: | :-: | :---: | :-: | :-: | :---: | :-: | :-: | :-: | :-: | :-: | :-: | :---: |
| `S01` | 10 | 29 | `22 / 0 / 7` | **19** | 65,5 | 19 / 8 | 19,00 | 0,8000 | 4,25 | 18,38 | 3,40 | 3,60 | `10/10` (100,0%) |
| `S02` | 10 | 35 | `22 / 10 / 3` | **20** | 57,1 | 39 / 15 | 19,50 | 0,7000 | 6,43 | 23,14 | 4,50 | 5,40 | `9/9` (100,0%) |
| `S03` | 9 | 42 | `21 / 15 / 6` | **30** | 71,4 | 69 / 24 | 23,00 | 1,0000 | 7,44 | 26,67 | 7,44 | 5,11 | `10/10` (100,0%) |
| `S04` | 9 | 46 | `24 / 12 / 10` | **22** | 47,8 | 91 / 32 | 22,75 | 0,8889 | 4,50 | 22,00 | 4,00 | 3,67 | `7/7` (100,0%) |
| `S05` | 9 | 60 | `23 / 24 / 13` | **16** | 26,7 | 107 / 35 | 21,40 | 0,3333 | 11,67 | 25,33 | 3,89 | 7,67 | `6/6` (100,0%) |
| `S06` | 10 | 59 | `19 / 34 / 6` | **36** | 61,0 | 143 / 45 | 24,80 | 1,0000 | 11,00 | 34,30 | 11,00 | 7,10 | `9/9` (100,0%) |
| `S07` | 10 | 53 | `24 / 23 / 6` | **32** | 60,4 | 175 / 54 | 27,20 | 0,9000 | 8,56 | 53,00 | 7,70 | 6,60 | `2/8` (25,0%) |
| `S08` | 10 | 52 | `34 / 18 / 0` | **25** | 48,1 | 200 / 63 | 26,20 | 0,9000 | 7,56 | 42,11 | 6,80 | 5,00 | `2/9` (22,2%) |
| `S09` | 10 | 64 | `32 / 22 / 10` | **13** | 20,3 | 213 / 68 | 24,40 | 0,5000 | 4,00 | 54,80 | 2,00 | 2,90 | `2/5` (40,0%) |
| `S10` | 9 | 42 | `20 / 19 / 3` | **4** | 9,5 | 217 / 70 | 22,00 | 0,2222 | 10,00 | 50,00 | 2,22 | 3,67 | `2/6` (33,3%) |
| `S11` | 10 | 43 | `10 / 24 / 9` | **32** | 74,4 | 249 / 82 | 21,20 | 1,2000 | 8,08 | 22,17 | 9,70 | 5,50 | `3/9` (33,3%) |
| `S12` | 9 | 34 | `20 / 11 / 3` | **18** | 52,9 | 267 / 90 | 18,40 | 0,8889 | 5,25 | 46,88 | 4,67 | 3,33 | `4/9` (44,4%) |
| `S13` | 10 | 41 | `19 / 16 / 6` | **22** | 53,7 | 289 / 95 | 17,80 | 0,5000 | 8,00 | 83,20 | 4,00 | 4,20 | `2/5` (40,0%) |
| `S14` | 9 | 52 | `28 / 13 / 11` | **17** | 32,7 | **306 / 100** | **18,60** | 0,5556 | 7,40 | 57,00 | 4,11 | 5,11 | **`1/6` (16,7%)** |

### 3.2 Burndown diário da Sprint `S14` (`vw_burndown_diario`, `9 du`)

| Dia | Data | Concluído no dia | Pontos concluídos (acum.) | Restante estático (`52`) | Restante dinâmico | Linha ideal (fim do dia) | Desvio vs. ideal | WIP observado (CFD) |
| :-: | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| 0 | Início | — | 0 | **52** | 41 | **52,00** | 0,00 | — |
| 1 | 03/11 (ter) | — | 0 | **52** | 44 | **46,22** | +5,78 | 5 |
| 2 | 04/11 (qua) | `LU-233(5)` | 5 | **47** | 39 | **40,44** | +6,56 | 6 |
| 3 | 05/11 (qui) | `LU-153(3), LU-234(1)` | 9 | **43** | 43 | **34,67** | +8,33 | 4 |
| 4 | 06/11 (sex) | `LU-235(3)` | 12 | **40** | 40 | **28,89** | +11,11 | 5 |
| 5 | 09/11 (seg) | — | 12 | **40** | 40 | **23,11** | +16,89 | 5 |
| 6 | 10/11 (ter) | — | 12 | **40** | 40 | **17,33** | +22,67 | 6 |
| 7 | 11/11 (qua) | `LU-152(5)` | 17 | **35** | 35 | **11,56** | +23,44 | 5 |
| 8 | 12/11 (qui) | — | 17 | **35** | 35 | **5,78** | +29,22 | 5 |
| 9 | 13/11 (sex) | — | 17 | **35** | 35 | **0,00** | +35,00 | 5 |

### 3.3 Diagrama de Fluxo Cumulativo (`vw_cfd_diario`, fechamento de cada sprint `S01`–`S14`)

| Sprint | Data fim | Total backlog | `A_FAZER` | `EM_ANDAMENTO` | `EM_REVISAO` | `EM_TESTE` | `CONCLUIDO` | WIP fim |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `S01` | 15/05/2026 | 88 | 77 | 1 | 2 | 0 | 8 | 3 |
| `S02` | 29/05/2026 | 90 | 71 | 2 | 2 | 0 | 15 | 4 |
| `S03` | 12/06/2026 | 94 | 66 | 1 | 2 | 1 | 24 | 4 |
| `S04` | 26/06/2026 | 97 | 60 | 3 | 1 | 1 | 32 | 5 |
| `S05` | 10/07/2026 | 103 | 60 | 3 | 0 | 5 | 35 | 8 |
| `S06` | 24/07/2026 | 104 | 54 | 1 | 2 | 2 | 45 | 5 |
| `S07` | 07/08/2026 | 110 | 51 | 3 | 0 | 2 | 54 | 5 |
| `S08` | 21/08/2026 | 111 | 43 | 4 | 0 | 1 | 63 | 5 |
| `S09` | 04/09/2026 | 118 | 47 | 3 | 0 | 0 | 68 | 3 |
| `S10` | 18/09/2026 | 127 | 50 | 3 | 0 | 4 | 70 | 7 |
| `S11` | 02/10/2026 | 131 | 45 | 4 | 0 | 0 | 82 | 4 |
| `S12` | 16/10/2026 | 132 | 39 | 2 | 1 | 0 | 90 | 3 |
| `S13` | 30/10/2026 | 134 | 36 | 2 | 0 | 1 | 95 | 3 |
| `S14` | 13/11/2026 | 141 | 36 | 4 | 0 | 1 | 100 | 5 |

### 3.4 Previsão de Releases (`vw_previsao_releases`) e distribuição de Cycle Time / Lead Time

| Corte | Release | Status | Base planejada | Saldo (`!= WONT`) | MM5 | Sprints rest. | Previsão | Último du / du projeto | Desvio |
| :---: | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `30/10` | `R1` | `ENTREGUE` | `S06` (`24/07`) | 0 pts | 17,80 | 0 | `S07` (`07/08`) | `07/08/2026` (`du 104`) | +1 sprint |
| `30/10` | `R2` | `EM_ABERTO` | `S12` (`16/10`) | 64 pts (`15` itens) | 17,80 | 4 | **`S17` (`25/12`)** | `24/12/2026` (`du 199`) | +5 sprints |
| `30/10` | `R3` | `EM_ABERTO` | `S17` (`25/12`) | 139 pts (`37` itens) | 17,80 | 8 | **`S21` (`19/02/2027`)** | `19/02/2027` (`du 236`) | +4 sprints |
| `13/11` | `R1` | `ENTREGUE` | `S06` (`24/07`) | 0 pts | 18,60 | 0 | `S07` (`07/08`) | `07/08/2026` (`du 104`) | +1 sprint |
| `13/11` | `R2` | `EM_ABERTO` | `S12` (`16/10`) | 64 pts (`17` itens) | 18,60 | 4 | **`S18` (`08/01/2027`)** | `08/01/2027` (`du 208`) | +6 sprints |
| `13/11` | `R3` | `EM_ABERTO` | `S17` (`25/12`) | 139 pts (`39` itens) | 18,60 | 8 | **`S22` (`05/03/2027`)** | `05/03/2027` (`du 246`) | +5 sprints |

**Métricas globais de fluxo (`vw_lead_cycle_time_itens`):**
- **Até `30/10/2026` (`95` itens concluídos):** CT médio `7,27 du` (`P50 = 6,00`, `P85 = 12,00`); LT médio `36,12 du` (`P50 = 23,00`, `P85 = 75,80`); revisão por par global `65/96` (`67,7%`).
- **Até `13/11/2026` (`100` itens concluídos):** CT médio `7,28 du` (`P50 = 6,00`, `P85 = 12,00`); LT médio `37,16 du` (`P50 = 22,00`, `P85 = 78,30`); revisão por par global `66/102` (`64,7%`).

**Impacto da revisão por par e *scope creep*:**
- De `S01` a `S06`, `49/49` (`100%`) dos itens revisados passaram por par com **`0` defeitos em produção** (`0,265` defeitos totais/item). Entre `S07` e `S13`, itens **sem revisão por par** geraram **`0,710` defeitos/item** (`22` em `31` itens; `9` em produção) contra **`0,125` defeitos/item** nos revisados (`2` em `16`; `1` em produção) — incidência **`5,7×` maior**.
- Em `R2`, `6` itens de `PEDIDO_DIRETO` (`32` pts sem solicitação de mudança) e `23` defeitos (`33` pts) somaram `65` pts adicionais ao backlog além dos `130` pts de `PLANO_INICIAL` e `8` pts de `MUDANCA_APROVADA`.

---

## 4. Indicadores DORA, defeitos e impedimentos (`vw_dora_qualidade`)

| Métrica | `30/10` (`PRODUCAO`) | `30/10` (`TODOS`) | `13/11` (`PRODUCAO`) | `13/11` (`TODOS`) |
| :--- | :---: | :---: | :---: | :---: |
| Amostra de implantações (`falhas`) | `13` (`7`) | `50` (`17`) | `14` (`8`) | `55` (`20`) |
| **Frequência (`PRODUCAO`/sem — base ágil)** | **0,500 / sem** (`26` sem) | 0,500 / sem | **0,500 / sem** (`28` sem) | 0,500 / sem |
| **Frequência (`PRODUCAO`/sem — pós-R1)** | **1,083 / sem** (`12` sem) | 1,083 / sem | **1,000 / sem** (`14` sem) | 1,000 / sem |
| **Lead Time de Mudanças (mediana / média)** | **39,30 h** / `47,82 h` | `35,75 h` / `41,15 h` | **38,85 h** / `47,15 h` | `35,70 h` / `40,68 h` |
| **Taxa de Falha em Mudanças (CFR)** | **53,85%** (`7/13`) | `34,00%` (`17/50`) | **57,14%** (`8/14`) | `36,36%` (`20/55`) |
| **MTTR — restauração (média / mediana)** | **4,16 h** / `3,70 h` | `2,85 h` / `2,20 h` | **3,96 h** / `3,15 h` | `2,74 h` / `2,35 h` |
| **Defeitos (`totais / resolvidos / abertos`)** | `32 / 31 / 1` | `32 / 31 / 1` | `37 / 32 / 5` | `37 / 32 / 5` |
| **Escape de defeitos p/ Produção** | `9` (`28,1%`) | `9` (`28,1%`) | `10` (`27,0%`) | `10` (`27,0%`) |
| **Impedimentos (`totais / abertos / du fechados`)** | `10 / 1 / 42 du` | `10 / 1 / 42 du` | `12 / 0 / 61 du` | `12 / 0 / 61 du` |

---

## 5. Views SQL reativas e reconciliação dos `13/13` controles

Todas as **8 views** foram criadas no schema `lume_educacao` via migration `create_m5_agile_flow_dora_views` (mantendo intactas as **46 tabelas base** e verificando **`13/13` `OK`** em `vw_numeros_controle`):

| View (`lume_educacao.*`) | Granularidade | Papel no sistema web e na banca |
| :--- | :--- | :--- |
| `vw_numeros_controle` | `13` linhas | Validação instantânea `30/10`, `13/11` (`13/13` `OK`) e `atual_dinamico` |
| `vw_lead_cycle_time_itens` | `141` itens (`backlog_itens`) | CT, LT, fila, reprovações, bloqueios, revisão por par e defeitos por item |
| `vw_cfd_diario` | `139` dias úteis (`04/05`–`13/11`) | Estado diário reconstruído via `itens_transicoes` + `wip_observado` |
| `vw_burndown_diario` | Sprint × dia útil (`139` linhas) | Burndown estático (`M5`), dinâmico, ideal e entregas do dia |
| `vw_velocidade_sprints` | `14` sprints (`S01`–`S14`) | Velocidade, MM5, vazão, CT/LT, WIP Little vs. observado e revisão por par |
| `vw_previsao_releases` | Corte × release (`9` linhas) | Previsão dinâmica de `R1`–`R3` (`2026-10-30`, `2026-11-13`, `ATUAL`) |
| `vw_dora_qualidade` | Corte × ambiente (`6` linhas) | 4 métricas DORA (`PRODUCAO` e `TODOS`) + defeitos + impedimentos |
| `vw_fluxo_agil_dora` | `3` cortes (`30/10`, `13/11`, `ATUAL`) | Visão única agregada para `R7`, `R8` e recálculo ao vivo no Boletim Surpresa |

---

## 6. Evidência de batimento 100% com o Jira `LU` (Board `35`, Sprint `38`)

O estado vivo do projeto `LU` no Jira Cloud (`victorjmello7.atlassian.net`, `Board 35`, Sprint `38`: `S14 — Quinzena de Campo (02/11 a 13/11/2026)`) bate **100%** com `vw_velocidade_sprints`, `vw_lead_cycle_time_itens` e [jira-s14-mapa.md](file:///C:/Users/Victor/.gemini/antigravity/scratch/lume-educacao/docs/jira-s14-mapa.md):

| Bloco no Jira `LU` | Contagem no Jira (`13/11`) | Contagem no Supabase (`13/11`) | Batimento |
| :--- | :---: | :---: | :---: |
| Épicos cadastrados (`LU-1`–`LU-8`) | `8` épicos | `8` épicos (`EP01`–`EP08`) | `100%` |
| Itens na Sprint `38` (`LU-9`–`LU-21`) | `13` itens (`52` pts) | `13` itens em `sprint_itens` (`52` pts) | `100%` |
| Itens `Concluído` na `S14` | `5` itens (`17` pts: `LU-9,10,11,12,20`) | `5` itens (`17` pts: `LU-152,153,233,234,235`) | `100%` |
| Itens `Em andamento` na `S14` | `4` itens (`18` pts: `LU-13,14,16,21`) | `4` itens (`18` pts: `LU-154,155,157,239`) | `100%` |
| Itens `Em análise` (`em-teste`) na `S14` | `1` item (`3` pts: `LU-15`) | `1` item `EM_TESTE` (`3` pts: `LU-156`) | `100%` |
| Itens `Tarefas pendentes` na `S14` | `3` itens (`14` pts: `LU-17,18,19`) | `3` itens `A_FAZER` (`14` pts: `LU-158,159,160`) | `100%` |
| Bugs abertos no backlog (`LU-22`–`LU-26`) | `5` bugs (`6` pts) | `5` bugs `A_FAZER` (`6` pts: `DF-033`–`DF-037`) | `100%` |

### Filtros JQL e Dashboard criados no Jira Cloud

- **Dashboard `10001`:** [Lume Educação — M5: Fluxo Ágil e Sprint S14 (LU)](https://victorjmello7.atlassian.net/jira/dashboards/10001) com `6` gadgets (`10004` Burndown Sprint S14, `10005` Integridade da Sprint S14, `10006` Pizza por Status, `10007` Matriz Bidimensional Tipo × Status, `10008` Itens sem Revisão por Par, `10009` Bugs Abertos B5).
- **6 filtros JQL salvos e validados:**
  - `10035`: [LU — S14: Quadro Ativo (13 itens, 52 pts)](https://victorjmello7.atlassian.net/issues/?filter=10035) (`13` itens)
  - `10036`: [LU — S14: Concluídos (5 itens, 17 pts)](https://victorjmello7.atlassian.net/issues/?filter=10036) (`5` itens)
  - `10037`: [LU — S14: Sem Revisão por Par](https://victorjmello7.atlassian.net/issues/?filter=10037) (`6` itens: `5` da `S14` + transbordo `LU-233`)
  - `10038`: [LU — S14: Scope Creep (Pedidos Diretos)](https://victorjmello7.atlassian.net/issues/?filter=10038) (`3` itens: `LU-11`, `LU-20`, `LU-21`)
  - `10039`: [LU — Backlog: Bugs Abertos (B5)](https://victorjmello7.atlassian.net/issues/?filter=10039) (`5` bugs: `LU-22`–`LU-26`)
  - `10040`: [LU — Produto Completo (S14 + Bugs B5)](https://victorjmello7.atlassian.net/issues/?filter=10040) (`18` itens)
- **Limitação documentada do Jira Cloud:** as issues de `LU` foram criadas no Jira em `20/11/2026` apenas para a fotografia da `S14` (`sprint = 38`) e novos bugs (`B5`), portanto os gráficos temporais nativos de Lead/Cycle Time ou série `S01`–`S13` no Jira não reproduzem as datas históricas de maio–novembro de `2026`; a fonte oficial para série histórica, `MM5`, Burndown `S13`/`S14` por dia útil real e `DORA` é o conjunto de views no Supabase.
