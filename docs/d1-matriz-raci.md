# D1 — Matriz RACI

**Projeto:** Plataforma de estudos por assinatura para o ENEM — Lume Educação
**Data de status:** 13/11/2026
**Fontes:** tabela 04 (equipe), 06 (EAP, responsável e critério de aceite), 07 (atividades e horas orçadas), 18 (apontamento de horas), 26 (riscos), 05 (alçadas) e 03 (partes interessadas).

> A base não traz uma tabela de RACI (a tarefa citava `09_raci.csv`, mas a tabela 09 é o orçamento). A matriz abaixo foi **montada** a partir do responsável de cada elemento da EAP (R), do responsável pela entrega (A) e do critério de aceite de cada pacote (quem aprova vira A ou C).

**Legenda:** R = executa · A = responde e aprova (um só por linha) · C = é consultado · I = é informado

---

## 1. Matriz por pacote de trabalho

| EAP | Pacote | Patroc. (PI01) | Gerente (P01) | PMO (P02) | Responsável do pacote | PO (P11) | Coord. pedag. (PI02) | Dir. tecnologia (PI04) | Dados/jurídico (PI05) | Dir. financeiro (PI03) |
|---|---|---|---|---|---|---|---|---|---|---|
| 1.1.1 | Descoberta | **A** | C | I | **R** P03 | C | C | C | | |
| 1.1.2 | Infraestrutura | I | **A** | I | **R** P04 | C | | C | | |
| 1.2.1 | Jurídico e dados | I | **A** | I | **R** P05 | | | | C | |
| 1.2.2 | Regulatório | I | **A** | I | **R** P05 | | C | | C | |
| 1.2.3 | Parcerias | I | **A** | I | **R** P06 | | | C | C | C |
| 1.3.1 | Hardware | I | **A** | I | **R** P07 | | | C | | C |
| 1.3.2 | Distribuição | I | **A** | I | **R** P07 | | | | | |
| 1.4.1 | Conteúdo | I | **A** | I | **R** P08 | | C | | C | |
| 1.4.2 | Marca e campanha | I | **A** | I | **R** P08 | C | C | | | |
| 1.5.1 | Piloto | I | **A** | I | **R** P09 | C | C | | C | |
| 1.5.2 | Atendimento | I | **A** | I | **R** P09 | | | | | |
| 1.5.3 | Treinamento | I | **A** | I | **R** P09 | | | | | |
| 1.6.1 | Testes finais | I | **A** | I | **R** P10 | C | | C | C | |
| 1.6.2 | Lançamento | C | **A** | I | **R** P09 | C | C | C | | |
| 1.6.3 | Estabilização | I | **A** | I | **R** P09 / P03 | C | | | | |
| 1.7.x | Releases 1 a 3 (ágil) | I | I | I | **R** time ágil (P12–P18) | **A** | C | C | | |
| — | Mudança de escopo até R$ 62.000 / 15 du | **A** | R | I | | C | C | | | C |
| — | Mudança acima disso ou no caso de negócio | C (comitê é A) | R | I | | C | | | | C |

**Regras de leitura**
- O gerente (P01) é o **A** de todas as entregas da frente preditiva (tabela 06). O patrocinador só é **A** onde o critério de aceite o nomeia (1.1.1) e nas mudanças da sua alçada.
- Na frente ágil, o **A** do backlog é o Product Owner (tabela 06, 1.7.x). Por isso nenhum item deveria entrar no backlog sem passar por ele.

---

## 2. Sobrecargas

| Pessoa | Papel | Pacotes como R | Atividades | Horas orçadas | Horas extras apontadas | Riscos de que é dona |
|---|---|---|---|---|---|---|
| **P09** Heitor Figueiredo | Coordenador de operações | **5** (1.5.1, 1.5.2, 1.5.3, 1.6.2, 1.6.3) | **9 de 39** | **828 h = 33% de 2.508 h** | **128 h = 25% das 507 h normais** | **6 de 17** (4 abertos) |
| P08 Luana Figueiredo | Analista de marketing | 2 | 6 | 360 h (14%) | 47 h = 7% das 643 h | 2 |
| P07 Noêmia Nascimento | Analista de logística | 2 | 7 | 376 h (15%) | 0 | 1 |
| P01 Helena Rebouças | Gerente do projeto | A de 6 entregas | — | — | 14 h | — |

Horas orçadas = soma de `horas_internas_orcadas` da tabela 07 nas 39 atividades estimadas (sem os 3 marcos ágeis).

- **P09 é o ponto único de falha do projeto.** Responde por um terço das horas da frente preditiva, concentra todo o fim do cronograma (piloto → atendimento → treinamento → lançamento → estabilização) e já faz hora extra de forma contínua (cerca de 3,5 h a 5,5 h por semana desde setembro). Dois dos riscos dele já ocorreram (R08 e R13).
- P08 também acumula hora extra (16 lançamentos), em linha com as SMs de conteúdo e campanha aprovadas (SM-002 e SM-005).

## 3. Lacunas

1. **Patrocinador ausente na decisão.** A patrocinadora é A das mudanças médias e do uso da reserva gerencial, mas faltou aos 4 últimos comitês (ago, set, out e 12/11). As SMs da alçada dela passaram a levar **22 a 29 dias** para decidir (SM-012 e SM-013), contra **9 a 13 dias** antes (SM-006, SM-009 e SM-010).
2. **Gerente agindo fora do seu papel.** O gerente aprovou 6 mudanças de escopo, mas não pode alterar escopo (ver D6).
3. **Backlog sem A na entrada.** Os 12 pedidos diretos da coordenadora pedagógica (52 pontos) entraram no backlog sem SM e sem passar pelo PO. Na prática, a PI02 assumiu um papel de A que não é dela.
4. **Aceite genérico na operação.** Os 5 pacotes de P09 usam o mesmo critério de aceite ("indicadores do piloto dentro do combinado"), sem dizer quem aceita. Proposta: o patrocinador é C no lançamento (1.6.2) e o PO é C no piloto (1.5.1), como na matriz.
5. **Sem substituto.** As disciplinas REG (P05: 1.2.1 e 1.2.2) e QA (P10: 1.6.1) têm uma só pessoa cada. A saída do desenvolvedor P14 em 21/08 não deixou lacuna, porque nenhum item ou risco ficou com ele.

## 4. Recomendações

- Dividir a carga de P09: passar **1.5.2 Atendimento e 1.5.3 Treinamento** para outra pessoa da operação (ou para o PO, no caso do treinamento no produto) e rever a dona dos riscos R06, R09 e R12.
- Formalizar a **delegação da alçada da patrocinadora** enquanto ela não comparecer ao comitê.
- Regra única para o backlog: **todo item novo entra pelo PO e com SM** quando vier de fora do time.
