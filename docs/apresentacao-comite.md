# LE-17 — Deck Executivo Top-Down para o Comitê Diretor (Lume Educação)

**Projeto:** Plataforma de Estudos por Assinatura para o ENEM — Lume Educação (`ENGN62`, Grupo 4)  
**Data de status:** 13/11/2026 (`du 171`) · **Término contratual:** 29/01/2027 (`du 223`)  
**Instância decisora:** Comitê Diretor (`05_matriz_alcadas`)  
**Formato do artefato PDF:** 13 slides em paisagem 16:9 (`docs/apresentacao-comite.pdf`), seguindo a identidade visual oficial da Lume Educação (`docs/design-tokens.json`, `docs/le26-design-system-lume.md`, `docs/guia_marca_design_system_lume_LE26.pdf`) e os números consolidados em `docs/le39-diagnostico-e-decisao.md`.

> **Nota sobre o arquivo binário PDF:** o arquivo `apresentacao-comite.pdf` (13 slides, 16:9) foi gerado, validado visualmente página a página, anexado ao card Jira `LE-17` e já se encontra publicado no repositório em [`docs/apresentacao-comite.pdf`](apresentacao-comite.pdf). Este documento consolida a estrutura completa Top-Down, Action Titles e inventário de dados do deck.

---

## Estrutura Top-Down (13 Slides — Princípio da Pirâmide)

| Slide | Seção | Action Title (Conclusão / So-What) | Dados-Chave e Visualização |
| :---: | :--- | :--- | :--- |
| **01** | Capa | *Diagnóstico Quantificado e Decisão de Rebaselining sob Alçadas* | Comitê Diretor · Status `13/11/2026 (du 171)` · `ENGN62 Grupo 4` · PMO Esquadrão Linha de Base |
| **02** | Recomendação Executiva | **Aprovar C4 isolado com 4 travas é a única opção com VPL positivo (+R$ 222,8 mil) e ganha R$ 176,4 mil sobre C1** | Término `23/04/2027 (+56 du)`, `ENT R$ 4.371.552`, `VPL +R$ 222.831`, Payback `4,27 anos`, Resultado `-R$ 101.969`; descarta `C4+C2` (`-R$ 74.796`); 4 travas |
| **03** | Achado 1 (M1/M2/M4) | **Término projeta 08/04/2027 (+46 du, P ≈ 0,00%) e crashing (R$ 8.540/du) destrói valor frente ao atraso (R$ 5.800/du)** | Caminho crítico pós-`A41` (`61 du`), PERT `Z = -13,94` (`σ = 3,30 du`), gráfico de custo marginal de crashing (`A35 R$ 6.700`, `-5 du R$ 8.540`, `A36 R$ 11.300`, `A32 R$ 11.700`) vs. `R$ 5.800/du` |
| **04** | Achado 2 (M3 — EVM) | **Custo real (R$ 3,13M) já superou o ONT (R$ 3,08M) com 75,2% agregado, elevando a ENT para R$ 4,17M** | Gráfico Curva S nos 3 cortes (`25/09`, `30/10`, `13/11`): `IDP 0,84`, `IDC 0,74` (Ágil `0,72 / 0,68`), `CR R$ 3.133.421`, `ENT R$ 4.168.735`, `VNT -R$ 1.084.843`, `IDPD -15,46` |
| **05** | Achado 3 (M8/D1) | **Sobrecarga em P09 (20,9% extras) e queda em A20 (índice 0,44) elevam o custo ágil para R$ 3.274/pt** | Folha `R$ 288.603,60/mês`, `13.092,5 h` internas (`289 h` extras), `5.513 hh` fornecedores (`A20 0,4416`), devs `0,0965 pts/hh`, `P09` (`115 h` extras, `5` pacotes, `6/17` riscos), reajuste jan–abr/27 `+R$ 35.122,12` |
| **06** | Achado 4 (D9/D15) | **Oito riscos consumiram 100% das reservas (R$ 170 mil), deixando R$ 60,3 mil de exposição aberta descoberta** | Gráfico de consumo das reservas (`R$ 77k + R$ 93k = R$ 170k` -> `-R$ 159,4k` 8 ameaças `-R$ 10,6k` 2 imprevistos -> saldo `R$ 0`), VME aberto `R$ 60.290` (`R15 = R$ 34.200` / `57%`, mitigação `R$ 8.000`), `6` SMs fora da alçada (`R$ 85k`) |
| **07** | Achado 5A (D14) | **Doze pedidos diretos de PI02 (52 pts) superam em 1,5× as SMs formais e drenam ~R$ 170 mil com 1/3 do valor** | Gráfico `52 pts` informais vs. `34 pts` SMs formais e valor médio `17,6` vs. `50,5`; `17,1%` da LB (`~2,5 sprints`), custo `R$ 170.233` (`~R$ 198,9k` benchmark `SM-010`), vazamento ativo `LU-235` / `LU-239 (8 pts)` |
| **08** | Achado 5B (M5/DORA) | **Queda da revisão por par para 16,7% multiplicou defeitos em 5,7×, elevou o CFR a 57,1% e travou R2 em 64 pts** | Gráfico Revisão por par (`100%` -> `16,7%`) e defeitos/item (`0,125` -> `0,710`); `CFR 57,14% (8/14)`, `S14 17/52 pts`, `MM5 18,60`, `R2` em `S18 (08/01/27)`, Lead Time `38,85 h`, MTTR `3,96 h`, `61 du` em impedimentos |
| **09** | Achado 6 (LE-5) | **Estouro e atraso evaporaram R$ 1,17M de VPL em C1, e retenção de 54,3% no piloto ameaça o churn < 6%** | Ponte de VPL (Caso Base `+R$ 1.156.935`, `TIR 22,89%`, Payback `3,63 a` -> `C1 -R$ 11.587` -> líquido `-R$ 278.387`); piloto `1.085` ativos, retenção `54,3%`, disp. `96,2%`, NPS `46`; itens `[incerto]` sinalizados |
| **10** | Comparativo `C1`–`C6` | **C4 isolado lidera em VPL (+R$ 222,8 mil), payback (4,27 anos) e resultado líquido (-R$ 102,0 mil) entre todas as opções** | Tabela completa `C1`–`C6` + `C4+C2` com proponente, prazo (`du`), desvio, ENT, VPL `15%`, payback, atraso, resultado líquido e notas `[incerto]` (`C4 +6,0%` e `C6` ponderado) |
| **11** | Trade-off Visual | **Combinar C4 + C2 destrói R$ 74,8 mil frente ao C4 isolado, enquanto C3 e C5 cortam valor sem resolver o prazo** | Gráficos de dispersão (Resultado Líquido vs. Prazo `du`) e barras de VPL por cenário; racional de descarte de `C4+C2`, `C3`, `C5` e `C6` |
| **12** | Governança (`D6`/`D12`) | **Rebaselining exige o Comitê Diretor e retomada de PI01 (ausente em 4 comitês) com contenção de PI02** | Matriz de Alçadas (`P01 ≤ R$ 15k`, `PI01 ≤ R$ 62k`, Comitê sem limite) + táticas para os 5 stakeholders críticos (`PI01`, `PI02`, `PI03`, `PI04`, `PI11`) |
| **13** | Plano de Ação (`S15`–`S16`) | **Quatro travas imediatas nas Sprints S15–S16 protegem o capital antes do desembolso da segunda praça** | 4 frentes de ação com prazos, responsáveis e gate comercial (`≥ +4,4%`) ao fim da `S16`: (1) Deliberação/Rebaselining/PI01, (2) Scope Creep/Qualidade, (3) R15 `R$ 8k`/Piloto `[incerto]`, (4) Alívio `P09`/Riscos |

---

## Itens `[incerto]` explicitamente sinalizados no Deck
1. **Ganho de benefício de `+6,0%` no `C4`** (Slides 2, 10 e 13) — condicionado ao gate empírico `≥ +4,4%` na `S16`.
2. **Churn mensal contratual de pagantes (`< 6%`) e base exata de assinantes pagantes vs. `9.000`** (Slides 9 e 13).
3. **Taxa atual de conversão do teste grátis (`R15 < 8%`)** (Slides 9 e 13).
4. **Ponderação de `50%` do custo do atraso em `C6`** (Slide 10 — mesmo ponderado em `-R$ 140.473`, segue inferior ao `C4` `-R$ 101.969`).
