# D14 — Auditoria de scope creep (pedidos diretos)

**Projeto:** Plataforma de estudos por assinatura para o ENEM — Lume Educação
**Data de status:** 13/11/2026
**Fontes:** tabela 14 (backlog, `origem` = PEDIDO_DIRETO), boletim B5 (itens criados na quinzena), boletim B6 (movimentos do quadro), tabelas 13, 28 e 01.

> Pergunta do comitê (dossiê): *"O que está entrando no escopo sem passar pelo controle de mudanças."*

---

## 1. Os 12 pedidos diretos

| Item | Criado em | Épico | Título | Pts | Valor de negócio | Release | Situação em 13/11 |
|---|---|---|---|---|---|---|---|
| LU-191 | 02/06 | EP01 Cadastro e plano | Ranking mensal de destaques | 2 | 9 | R1 | Concluído (S03) |
| LU-192 | 08/06 | EP04 Correção de redação | Painel ao vivo para a reunião de diretoria | 3 | 27 | R1 | Concluído (S04) |
| LU-201 | 03/07 | EP07 Painel escola e pais | Banner promocional na tela inicial | 5 | 25 | R1 | Concluído (S06) |
| LU-202 | 06/07 | EP07 Painel escola e pais | Mensagem de boas-vindas personalizada | 5 | 8 | R1 | Concluído (S06) |
| LU-203 | 07/07 | EP02 Videoaulas | Campo extra no cadastro para a campanha | 3 | 22 | R1 | Concluído (S06) |
| LU-205 | 28/07 | EP07 Painel escola e pais | Exportar dados para a planilha comercial | 2 | 17 | R1 | Concluído (S08) |
| LU-214 | 25/08 | EP04 Correção de redação | Cupom para o evento de lançamento | 8 | 19 | R2 | Concluído (S11) |
| LU-228 | 22/09 | EP03 Questões e simulados | Botão de compartilhar nas redes | 3 | 11 | R2 | Concluído (S11) |
| LU-231 | 24/09 | EP05 Trilhas e gamificação | Vídeo de apresentação na tela de entrada | 5 | 23 | R2 | Concluído (S12) |
| LU-233 | 23/10 | EP05 Trilhas e gamificação | Relatório especial para a reunião de diretoria | 5 | 15 | R2 | Concluído em 04/11 (S14) |
| LU-235 | 03/11 | EP05 Trilhas e gamificação | Tela de novidades do mês | 3 | — | R2 | Concluído em 06/11 (S14) |
| LU-239 | 05/11 | EP02 Videoaulas | Personalizar as cores para um cliente grande | 8 | — | R2 | Em andamento (S14) |
| **Total** | | | | **52** | | | **11 concluídos (44 pts) · 1 em andamento (8 pts)** |

**Solicitante dos 12:** PI02. Nenhum passou por solicitação de mudança (SM).

## 2. Tamanho do problema

| Indicador | Conta | Resultado |
|---|---|---|
| Peso sobre o escopo da linha de base | 52 ÷ 304 pts (plano inicial sem WONT) | **17,1%** |
| Comparação com o escopo que entrou por SM | 52 pts diretos × 34 pts por SM aprovada (SM-006, 009, 010, 013) | **1,5 vez mais** escopo informal que formal |
| Capacidade do time consumida | 44 pts concluídos ÷ 17,9 pts/sprint planejados | **≈ 2,5 sprints** |
| Custo estimado | 52 pts × R$ 3.825/pt (custo por ponto da SM-010: 30.600 ÷ 8) | **≈ R$ 198.900** |
| Valor de negócio médio | 10 itens com valor: 176 ÷ 10 = 17,6, contra 50,5 no plano inicial | **≈ 1/3 do valor** dos itens do plano |
| Revisão por par pulada | LU-205, 214, 228, 233 | **4 de 10** |

## 3. Achados

1. **O escopo informal já é maior que o formal.** Entraram 52 pontos por pedido direto e só 34 por SM aprovada. Isso dá 2,5 sprints de trabalho que não estavam no plano. Esses pontos explicam parte do IDP 0,83 da frente ágil (ver M3).
2. **Os pedidos entregam pouco valor.** O valor de negócio médio é um terço do valor dos itens do plano. Vários servem a eventos e à diretoria (painel e relatório para reunião, cupom de evento, banner), não ao estudante.
3. **Os pedidos entram com prioridade sobre o plano.** Ficam marcados como SHOULD, mas furam a fila: 11 dos 12 entraram na mesma sprint em que foram criados ou na seguinte (só o LU-214 esperou duas sprints), enquanto itens MUST do plano inicial seguem pendentes.
4. **O problema não parou.** Dois pedidos novos (LU-235 e LU-239, 11 pts) entraram na sprint S14 durante a execução, com a sprint já planejada.
5. **O atalho piora a qualidade.** 40% dos pedidos diretos pularam a revisão por par. Isso alimenta o R01 (dívida técnica), que é um risco ainda aberto.
6. **O registro de riscos não enxerga o problema.** O R14 (pedidos diretos) foi marcado como ocorrido com custo de R$ 4.900 e parou de ser acompanhado (ver D9).

## 4. Por que acontece

- A PI02 tem poder e interesse altos e engajamento RESISTENTE desde julho. Ela também é autora de 7 das 14 SMs (D12).
- A patrocinadora (PI01) está ausente dos últimos 4 comitês, e o comitê sem ela decide pouco: 1,3 decisões e 6,0 pendências por reunião (D11). Sem esse canal funcionando, o pedido vai direto ao time.
- O Product Owner aceita itens sem SM. Não há regra no fluxo do quadro que barre isso.

## 5. Recomendações

1. **Regra no quadro:** item sem SM ou sem origem PLANO_INICIAL/DEFEITO não entra em sprint.
2. **Regularizar o LU-239 (8 pts, em andamento):** abrir uma SM retroativa e levá-la ao comitê, pela alçada de escopo da tabela 05.
3. **Canal formal para a PI02:** reunião quinzenal com o PO para triar os pedidos dela em SMs (D11).
4. **Reabrir o R14** com o impacto real e um dono no comitê (D9).
5. **Levar ao comitê** a troca de pedidos diretos ainda não feitos por itens MUST pendentes, se o C4 for aprovado (D16).
