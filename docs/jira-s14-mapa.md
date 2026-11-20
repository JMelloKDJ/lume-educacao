# Mapeamento da Sprint S14 no Jira (`LU`) — Lume Educação

O projeto Scrum **`LU`** espelha no Jira Cloud o backlog de produto da Lume Educação para a quinzena de campo **03 a 13/11/2026** (boletins **B5**, **B6** e **B7**), com **8 épicos** (`LU-1` a `LU-8`), **13 itens ativos na Sprint S14** (`LU-9` a `LU-21`) e **5 bugs abertos no backlog** (`LU-22` a `LU-26`).

## 1. Estrutura do projeto e limitações do template

- **Projeto de produto:** `LU` (`id: 10034`, template `gh-simplified-agility-scrum`, separado do projeto acadêmico `LE` de gestão do grupo).
- **Quadro Scrum:** [Quadro LU — Board 35](https://victorjmello7.atlassian.net/jira/software/projects/LU/boards/35) (`boardId: 35`).
- **Sprint ativa:** `S14 — Quinzena de Campo (02/11 a 13/11/2026)` (`sprintId: 38`), com início em `02/11/2026`, término em `13/11/2026` e meta `"Avançar o épico Tutor com IA"`.
- **Sprint padrão não utilizada:** `LU Sprint 1` (`sprintId: 37`, estado `future`), mantida vazia por criação automática do template.
- **Releases cadastradas no projeto:** 3 versões criadas (`10000` `R1 — Release 1 (MVP)` marcada como `released: true`; `10001` `R2 — Release 2`; `10002` `R3 — Release 3`).
- **Limitação do campo `fixVersions`:** o template simplificado gerenciado por equipe (`gh-simplified-agility-scrum`) não expõe `fixVersions` na tela de criação/edição via CLI `twg` (`Available values: none`). A rastreabilidade da `Release R2` foi preservada via label `release-r2` e texto explícito na descrição de todos os 18 itens.
- **Mapeamento da coluna `EM_TESTE`:** o fluxo padrão do projeto `LU` possui quatro colunas (`Tarefas pendentes` [`10037`], `Em andamento` [`3`], `Em análise` [`10038`] e `Concluído` [`10036`]). O item `LU-156` (`LU-15`), único encerrado em `EM_TESTE` em `13/11/2026`, foi movido para **`Em análise`** com a label **`em-teste`** e nota explícita no comentário e na descrição.

---

## 2. Épicos mapeados (`EP01` a `EP08`)

| ID Dossiê | Chave Jira | Resumo | Link |
| :--- | :--- | :--- | :--- |
| `EP01` | `LU-1` | `[EP01] Cadastro e plano de estudos` | [LU-1](https://victorjmello7.atlassian.net/browse/LU-1) |
| `EP02` | `LU-2` | `[EP02] Videoaulas` | [LU-2](https://victorjmello7.atlassian.net/browse/LU-2) |
| `EP03` | `LU-3` | `[EP03] Questões e simulados` | [LU-3](https://victorjmello7.atlassian.net/browse/LU-3) |
| `EP04` | `LU-4` | `[EP04] Correção de redação` | [LU-4](https://victorjmello7.atlassian.net/browse/LU-4) |
| `EP05` | `LU-5` | `[EP05] Trilhas e gamificação` | [LU-5](https://victorjmello7.atlassian.net/browse/LU-5) |
| `EP06` | `LU-6` | `[EP06] Assinatura e pagamento` | [LU-6](https://victorjmello7.atlassian.net/browse/LU-6) |
| `EP07` | `LU-7` | `[EP07] Painel da escola e dos pais` | [LU-7](https://victorjmello7.atlassian.net/browse/LU-7) |
| `EP08` | `LU-8` | `[EP08] Tutor com IA` | [LU-8](https://victorjmello7.atlassian.net/browse/LU-8) |

---

## 3. Itens da Sprint S14 e novos bugs do backlog (`LU-9` a `LU-26`)

| ID Dossiê | Chave Jira | Tipo | Épico | Pontos | Entrada | Status BD (`13/11`) | Status Jira | Rev. Par | Ocorrência / Impedimento / Defeito |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| `LU-152` | [LU-9](https://victorjmello7.atlassian.net/browse/LU-9) | Tarefa | `EP08` (`LU-8`) | 5 | `TRANSBORDO` | `CONCLUIDO` | `Concluído` | não | `IP-010` fechado em `05/11/2026` (`7 du`) |
| `LU-153` | [LU-10](https://victorjmello7.atlassian.net/browse/LU-10) | Tarefa | `EP08` (`LU-8`) | 3 | `TRANSBORDO` | `CONCLUIDO` | `Concluído` | não | — |
| `LU-233` | [LU-11](https://victorjmello7.atlassian.net/browse/LU-11) | História | `EP05` (`LU-5`) | 5 | `TRANSBORDO` | `CONCLUIDO` | `Concluído` | não (`S13`) | Transbordo de `S13` já em `EM_TESTE` |
| `LU-234` | [LU-12](https://victorjmello7.atlassian.net/browse/LU-12) | Bug | `EP05` (`LU-5`) | 1 | `PLANEJAMENTO` | `CONCLUIDO` | `Concluído` | não | Encerra defeito `DF-032` em `05/11/2026` |
| `LU-154` | [LU-13](https://victorjmello7.atlassian.net/browse/LU-13) | Tarefa | `EP04` (`LU-4`) | 5 | `PLANEJAMENTO` | `EM_ANDAMENTO` | `Em andamento` | — | `IP-012` (`05/11` a `13/11`, `6 du`, ambiente indisponível) |
| `LU-155` | [LU-14](https://victorjmello7.atlassian.net/browse/LU-14) | Tarefa | `EP05` (`LU-5`) | 3 | `PLANEJAMENTO` | `EM_ANDAMENTO` | `Em andamento` | — | `IP-011` (`04/11` a `12/11`, `6 du`, dependência externa) |
| `LU-156` | [LU-15](https://victorjmello7.atlassian.net/browse/LU-15) | Tarefa | `EP04` (`LU-4`) | 3 | `PLANEJAMENTO` | `EM_TESTE` | `Em análise` | não | Label `em-teste` |
| `LU-157` | [LU-16](https://victorjmello7.atlassian.net/browse/LU-16) | Tarefa | `EP08` (`LU-8`) | 2 | `PLANEJAMENTO` | `EM_ANDAMENTO` | `Em andamento` | não | Reprovado no teste em `12/11/2026` (`EM_TESTE -> EM_ANDAMENTO`) |
| `LU-158` | [LU-17](https://victorjmello7.atlassian.net/browse/LU-17) | História | `EP08` (`LU-8`) | 3 | `PLANEJAMENTO` | `A_FAZER` | `Tarefas pendentes` | — | Não iniciado na quinzena |
| `LU-159` | [LU-18](https://victorjmello7.atlassian.net/browse/LU-18) | História | `EP08` (`LU-8`) | 8 | `PLANEJAMENTO` | `A_FAZER` | `Tarefas pendentes` | — | Não iniciado na quinzena |
| `LU-160` | [LU-19](https://victorjmello7.atlassian.net/browse/LU-19) | História | `EP01` (`LU-1`) | 3 | `PLANEJAMENTO` | `A_FAZER` | `Tarefas pendentes` | — | Não iniciado na quinzena |
| `LU-235` | [LU-20](https://victorjmello7.atlassian.net/browse/LU-20) | História | `EP05` (`LU-5`) | 3 | `ADICIONADO_DURANTE` | `CONCLUIDO` | `Concluído` | sim | Pedido direto (`PI02`), único item com revisão por par na `S14` |
| `LU-239` | [LU-21](https://victorjmello7.atlassian.net/browse/LU-21) | História | `EP02` (`LU-2`) | 8 | `ADICIONADO_DURANTE` | `EM_ANDAMENTO` | `Em andamento` | — | Pedido direto (`PI02`) em `05/11/2026` |
| `LU-236` | [LU-22](https://victorjmello7.atlassian.net/browse/LU-22) | Bug | `EP05` (`LU-5`) | 1 | `BACKLOG` | `A_FAZER` | `Tarefas pendentes` | — | Defeito `DF-033` (origem `LU-148`, `MEDIA`, `TESTE`, aberto `03/11`) |
| `LU-237` | [LU-23](https://victorjmello7.atlassian.net/browse/LU-23) | Bug | `EP05` (`LU-5`) | 2 | `BACKLOG` | `A_FAZER` | `Tarefas pendentes` | — | Defeito `DF-034` (origem `LU-148`, `MEDIA`, `PRODUCAO`, aberto `03/11`) |
| `LU-238` | [LU-24](https://victorjmello7.atlassian.net/browse/LU-24) | Bug | `EP05` (`LU-5`) | 1 | `BACKLOG` | `A_FAZER` | `Tarefas pendentes` | — | Defeito `DF-035` (origem `LU-148`, `MEDIA`, `TESTE`, aberto `03/11`) |
| `LU-240` | [LU-25](https://victorjmello7.atlassian.net/browse/LU-25) | Bug | `EP01` (`LU-1`) | 1 | `BACKLOG` | `A_FAZER` | `Tarefas pendentes` | — | Defeito `DF-036` (origem `LU-225`, `BAIXA`, `TESTE`, aberto `11/11`) |
| `LU-241` | [LU-26](https://victorjmello7.atlassian.net/browse/LU-26) | Bug | `EP04` (`LU-4`) | 1 | `BACKLOG` | `A_FAZER` | `Tarefas pendentes` | — | Defeito `DF-037` (origem `LU-150`, `MEDIA`, `TESTE`, aberto `11/11`) |

---

## 4. Indicadores consolidados da Sprint S14 (`13/11/2026`)

- **Comprometimento x velocidade:** **13 itens** (`52` story points na Sprint S14, sendo `11` previstos inicialmente + `2` adicionados durante a execução) e **5 itens concluídos** (`17` story points — `LU-152`, `LU-153`, `LU-233`, `LU-234`, `LU-235`, equivalentes a `32,7%` dos pontos da sprint).
- **Histórico de transições (`B6`):** **25 transições** registradas na tabela `itens_transicoes` (`T00425` a `T00449`), documentadas em comentários cronológicos nos **10 itens** que tiveram movimentação na `S14` (`LU-9` a `LU-16`, `LU-20` e `LU-21`).
- **Aderência à revisão por par:** entre os **6 itens** que passaram por `EM_REVISAO` durante a `S14` (`LU-152`, `LU-153`, `LU-156`, `LU-157`, `LU-234`, `LU-235`), apenas **1 item (`LU-235` / `LU-20`)** teve `revisao_por_par = 1` (`16,7%`; ou `1/7 = 14,3%` considerando também o transbordo `LU-233` já revisado na `S13` com `revisao_por_par = 0`).
- **Impedimentos (`B7`):** **3 impedimentos** ativos ou resolvidos no período — `IP-010` em `LU-152` (`7 du`, encerrado em `05/11/2026`), `IP-011` em `LU-155` (`6 du`, encerrado em `12/11/2026`) e `IP-012` em `LU-154` (`6 du`, encerrado em `13/11/2026`).
- **Reconstrução dos títulos dos 5 bugs (`LU-236` a `LU-241`):** os títulos truncados com reticências (`…`) no boletim `B5` foram gravados no banco e no Jira pelo título exato do item de origem vinculado em `defeitos.id_item_origem` (`LU-148`, `LU-225` e `LU-150`), sem criar sintomas não informados.
