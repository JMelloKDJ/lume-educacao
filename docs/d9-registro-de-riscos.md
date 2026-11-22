# D9 — Registro de riscos

**Projeto:** Plataforma de estudos por assinatura para o ENEM — Lume Educação
**Data de status:** 13/11/2026 (a quinzena de 03 a 13/11 não teve ocorrência de risco, boletim B8)
**Fontes:** tabelas 26 (registro), 27 (ocorrências) e 04 (equipe); convenção 12 do dicionário (VME = probabilidade × impacto em custo; exposição = soma do VME das ameaças abertas).

---

## 1. Registro completo

| Id | Tipo | Categoria | Risco | Prob. | Impacto (R$ / du) | VME (R$) | Resposta | Dono | Situação |
|---|---|---|---|---|---|---|---|---|---|
| R01 | Ameaça | Técnico | Dívida técnica reduzir a velocidade do time | 47% | 22.000 / 0 | 10.340 | Mitigar (1.200) | P03 Wesley | **Aberto** |
| R02 | Ameaça | Regulatório | Autoridade de dados questionar a base legal | 20% | 17.000 / 10 | 3.400 | Mitigar (1.300) | P05 Túlio | Encerrado |
| R03 | Ameaça | Fornecedor | Nuvem indisponível no lançamento | 18% | 25.000 / 3 | 4.500 | Mitigar (1.300) | P09 Heitor | **Aberto** |
| R04 | Oportunidade | Técnico | Reaproveitar componentes e encurtar a Release 3 | 27% | −15.000 / 0 | −4.050 | Melhorar (1.300) | P07 Noêmia | **Aberto** |
| R05 | Ameaça | Pessoas | Professores atrasarem as videoaulas | 50% | 24.000 / 20 | 12.000 | Mitigar (2.600) | P08 Luana | Ocorrido |
| R06 | Ameaça | Externo | Escolas adiarem o piloto | 35% | 12.000 / 15 | 4.200 | Aceitar | P09 Heitor | **Aberto** |
| R07 | Ameaça | Regulatório | Editoras negarem licença das questões | 30% | 42.000 / 15 | 12.600 | Evitar (5.100) | P05 Túlio | Ocorrido |
| R08 | Ameaça | Fornecedor | Central de atendimento sem treino no lançamento | 30% | 11.000 / 8 | 3.300 | Mitigar (1.200) | P09 Heitor | Ocorrido |
| R09 | Oportunidade | Mercado | Parceria de distribuição com grande rede | 25% | −36.000 / 0 | −9.000 | Explorar (2.200) | P09 Heitor | **Aberto** |
| R10 | Ameaça | Técnico | Falha de segurança no teste de invasão | 32% | 17.000 / 10 | 5.440 | Mitigar (1.000) | P10 Lorena | **Aberto** |
| R11 | Ameaça | Pessoas | Saída de desenvolvedor sênior | 36% | 29.000 / 0 | 10.440 | Mitigar (3.400) | P04 Otávio | Ocorrido |
| R12 | Ameaça | Técnico | Aplicativo reprovado nas lojas | 23% | 7.000 / 6 | 1.610 | Mitigar (400) | P09 Heitor | **Aberto** |
| R13 | Ameaça | Pessoas | Baixa adesão no piloto | 36% | 16.000 / 10 | 5.760 | Mitigar (1.500) | P09 Heitor | Ocorrido |
| R14 | Ameaça | Escopo | Pedidos diretos fora do controle de mudanças | 58% | 16.000 / 0 | 9.280 | Mitigar (1.300) | P03 Wesley | Ocorrido |
| R15 | Ameaça | Mercado | Conversão do teste grátis abaixo de 8% | 45% | 76.000 / 0 | 34.200 | Mitigar (8.000) | P02 Nelson | **Aberto** |
| R16 | Ameaça | Técnico | Tutor com IA errar em exatas | 40% | 32.000 / 15 | 12.800 | Mitigar (4.100) | P06 Gustavo | Ocorrido |
| R17 | Ameaça | Mercado | Custo de aquisição da campanha acima do previsto | 42% | 24.000 / 0 | 10.080 | Aceitar | P08 Luana | Ocorrido |

**Resumo:** 17 riscos (15 ameaças, 2 oportunidades). 8 ocorridos, 1 encerrado, 8 abertos (6 ameaças + 2 oportunidades).

## 2. Exposição atual (convenção 12)

| | VME (R$) |
|---|---|
| Ameaças abertas: R01 + R03 + R06 + R10 + R12 + R15 | 10.340 + 4.500 + 4.200 + 5.440 + 1.610 + 34.200 = **60.290** |
| Oportunidades abertas: R04 + R09 | −4.050 − 9.000 = −13.050 |
| Exposição líquida (se as oportunidades forem aproveitadas) | 47.240 |

- **R15 sozinho é 57% da exposição** (34.200 de 60.290). Ele mira direto o objetivo do projeto (9.000 assinantes pagantes).
- Custo das respostas ainda previstas para as ameaças abertas: R$ 11.900.

## 3. O que já aconteceu: estimado × real

| Ocorrência | Risco | Impacto estimado (R$) | Custo real (R$) | Atraso real (du) |
|---|---|---|---|---|
| OC-001 | R05 videoaulas | 24.000 | 19.300 | 18 |
| OC-002 | R17 campanha | 24.000 | **30.600** | 0 |
| OC-003 | R16 tutor IA | 32.000 | 32.200 | **20** |
| OC-006 | R07 licença | 42.000 | 39.700 | 17 |
| OC-007 | R14 pedidos diretos | 16.000 | 4.900 | 0 |
| OC-008 | R11 saída de sênior | 29.000 | 11.200 | 0 |
| OC-009 | R08 central | 11.000 | 11.000 | 6 |
| OC-010 | R13 adesão | 16.000 | 10.500 | 13 |
| **Riscos identificados** | | **194.000** | **159.400** | **74** |
| OC-004 | *não identificado:* bloqueio da conta de anúncios | — | 3.600 | 2 |
| OC-005 | *não identificado:* credencial exposta no repositório | — | 7.000 | 5 |
| **Imprevistos** | | | **10.600** | **7** |
| **Total** | | | **170.000** | **81** |

## 4. Achados

1. **Os riscos se materializaram mais do que o VME previa.** O VME dos 8 riscos que ocorreram somava R$ 76.260, mas eles custaram R$ 159.400 (2,1 vezes mais). O VME é uma média: ele serve para dimensionar a reserva, não para prever o custo de quem ocorre.
2. **R14 está subestimado.** O registro lança só R$ 4.900 para os pedidos diretos, mas eles somam 52 pontos fora do controle de mudanças (ver D14). O risco foi marcado como ocorrido e parou de ser acompanhado, mas o problema continua (2 pedidos novos na última quinzena).
3. **Dois imprevistos viraram riscos a registrar.** OC-004 (bloqueio da conta de anúncios) e OC-005 (credencial exposta) não estavam no registro. A credencial exposta pede um risco de segurança novo, ligado ao R10, antes do teste de invasão.
4. **P09 (Heitor, coordenador de operações) é dono de 6 dos 17 riscos** (R03, R06, R08, R09, R12, R13), 3 deles ainda abertos. É a mesma pessoa sobrecarregada no D1 (33% das horas preditivas, 25% de hora extra).
5. **R06 e R17 têm resposta "aceitar" sem reserva para cobrir.** R17 já ocorreu e custou 28% acima do estimado. A reserva acabou (ver D15), então aceitar o R06 agora significa absorver o custo sem fonte.

## 5. Ações recomendadas

- Reabrir o R14 com o impacto real dos pedidos diretos e um dono no comitê, não no time.
- Registrar os riscos novos de OC-004 e OC-005.
- Redistribuir os riscos do P09.
- Priorizar a resposta do R15 (R$ 8.000): é o risco que mais pesa e o que ameaça o objetivo do projeto.
