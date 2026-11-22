# D11 — Plano de comunicações

**Projeto:** Plataforma de estudos por assinatura para o ENEM — Lume Educação
**Data de status:** 13/11/2026
**Fontes:** tabela 33 (80 reuniões, 10/03 a 30/10) + boletim B9 (6 reuniões, 03 a 13/11) = **86 reuniões**; tabela 03 (partes interessadas); D12 (mapa de engajamento).

---

## 1. Como a comunicação funcionou até 13/11

| Reunião | Qtd | Duração | Convidados (média) | Presença | Patrocinadora presente | Decisões | Pendências | Ata publicada |
|---|---|---|---|---|---|---|---|---|
| Status semanal | 35 | 45–90 min | 9,1 | 272/318 = 86% | 4 (última em 21/07) | 44 | 119 | **29/35** |
| Comitê diretor | 9 | 90–120 min | 6,9 | 53/62 = 85% | **5 (última em 09/07)** | 29 | 34 | 9/9 |
| Planejamento da sprint | 14 | 120 min | 8,0 | 110/112 = 98% | 0 | 14 | 0 | 14/14 |
| Revisão da sprint | 14 | 60 min | 12,2 | 144/171 = 84%* | 2 | 16 | 16 | 14/14 |
| Retrospectiva | 14 | 60 min | 8,0 | 110/112 = 98% | 0 | 30 | 16 | **12/14** |

\* RE-020 e RE-031 registram 13 presentes para 12 convidados (erro de dado). Os presentes foram limitados aos convidados: 146 − 2 = 144.

### O comitê sem a patrocinadora

| | Com a patrocinadora (mar–jul, 5 comitês) | Sem a patrocinadora (ago–nov, 4 comitês) |
|---|---|---|
| Decisões por comitê | 24 ÷ 5 = **4,8** | 5 ÷ 4 = **1,3** |
| Pendências por comitê | 10 ÷ 5 = **2,0** | 24 ÷ 4 = **6,0** |

### Problemas encontrados
1. **O comitê parou de decidir.** Sem a patrocinadora, as decisões por comitê caíram a um quarto e as pendências triplicaram. O comitê é o fórum dos seis cenários em aberto.
2. **Atas faltando no status semanal.** 6 das 35 não foram publicadas, e **5 dessas 6 são de agosto em diante** (RE-051, 060, 062, 073 e 078). Justo no período em que as pendências subiram.
3. **Pendências acumulando no status semanal:** de 1 a 4 por reunião até julho e de 3 a 6 desde agosto.
4. **Partes de alto poder fora dos fóruns.** Diretor financeiro (PI03), conselho de sócios (PI11) e órgão regulador (PI06) não têm um canal próprio na rotina de reuniões, mesmo estando no quadrante "manter satisfeito".

---

## 2. Plano de comunicações

| O quê | Para quem | Objetivo | Frequência | Canal | Responsável | Registro |
|---|---|---|---|---|---|---|
| **Comitê diretor** | PI01, PI03, PI04, P01 (PI02 como convidada) | Decidir cenários, SMs acima do patrocinador e uso de reservas | Mensal + extraordinário se houver ≥ 5 pendências | Presencial | Gerente (P01) | Ata em 48 h |
| **Pré-comitê com a patrocinadora** | PI01 | Levar as decisões pendentes já preparadas; se ela não puder, formalizar a delegação | Quinzenal | Reunião individual | Gerente (P01) | Resumo por escrito |
| **Status semanal** | Equipe de gestão e líderes de disciplina | Avanço, impedimentos, riscos e pendências | Semanal | Reunião de 60 min | Gerente (P01) | **Ata obrigatória em 24 h** com lista de pendências e dono |
| **Relatório de status** | PI01, PI03, PI04, PI13 | Prazo, custo (VPL/IDC/IDP), riscos e SMs | Quinzenal | E-mail + painel | PMO (P02) | Repositório do projeto |
| **Relatório financeiro** | PI03 Diretor financeiro | ENT, reservas, desembolsos e SMs aprovadas | Mensal | Reunião de 30 min | Gerente (P01) | Ata |
| **Resumo executivo** | PI11 Conselho de sócios | VPL, prazo e uso do capital | Trimestral | Documento | Patrocinadora (PI01) | Documento |
| **Planejamento, revisão e retrospectiva** | Time ágil, PO; revisão aberta a PI02, PI04, PI09 | Ritos do Scrum | A cada sprint (2 semanas) | Presencial | Scrum Master (P12) | Ata de todas, inclusive da retrospectiva |
| **Refinamento do backlog** | PO, PI02 | Trazer as demandas da coordenadora para dentro do processo | A cada sprint | Reunião | Product Owner (P11) | Backlog atualizado + SM quando couber |
| **Comunicação regulatória** | PI06 Órgão regulador, PI05 | Protocolos e prazos legais | Por marco | Ofício | Encarregado de dados (PI05) | Protocolo |
| **Reunião de parceria** | PI07 Rede de escolas | Contrato, integração e datas | Mensal | Reunião | Analista de parcerias (P06) | Ata |
| **Calendário de marcos** | PI08 Fornecedor, PI13 Marketing | Marcos de entrega, aceite, pagamento e datas da campanha | Mensal e a cada mudança de data | E-mail | PMO (P02) | Calendário |
| **Canal do piloto** | PI09 Escolas do piloto, PI12 Estudantes | Suporte, novidades e pesquisa de satisfação | Semanal | Canal de suporte + no produto | Coordenador de operações (P09) | Registro de chamados |
| **Treinamento** | PI10 Atendimento | Preparar a operação | Por release | Treinamento + base de conhecimento | Coordenador de operações (P09) | Lista de presença |

## 3. Regras de escalonamento

| Situação | Prazo para resolver no nível | Sobe para |
|---|---|---|
| Pendência do status semanal sem dono ou parada | 2 semanas | Comitê diretor |
| SM fora da alçada do gerente (ver D6) | 10 dias úteis | Patrocinador (ou o delegado dela) |
| Pendência do comitê sem decisão | 1 comitê | Reunião extraordinária com a patrocinadora |
| Pedido de funcionalidade fora da SM | Imediato | Product Owner, que registra e devolve ao processo |

## 4. Indicadores para acompanhar o plano

- Atas publicadas no prazo: **meta 100%** (hoje 29/35 = 83% no status semanal).
- Presença da patrocinadora (ou do delegado) no comitê: **meta 100%** (hoje 0 dos últimos 4).
- Pendências por comitê: **meta ≤ 2** (hoje 6,0).
