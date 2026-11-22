# D6 — Matriz de alçadas e conferência das mudanças

**Projeto:** Plataforma de estudos por assinatura para o ENEM — Lume Educação
**Data de status:** 13/11/2026
**Fontes:** tabela 05 (alçadas), tabela 28 (solicitações de mudança), boletim B8 (nenhuma SM na quinzena) e tabela 14 (pedidos diretos).

---

## 1. Matriz de alçadas

| Nível | Custo máximo | Prazo máximo | Altera escopo? | O que decide |
|---|---|---|---|---|
| **Gerente do projeto** (P01) | R$ 15.000 | 5 du | **Não** | Mudanças pequenas, sem alterar o escopo aprovado |
| **Patrocinador** (PI01) | R$ 62.000 | 15 du | Sim | Mudanças médias e o uso da reserva gerencial (R$ 93.000) |
| **Comitê diretor** | sem limite | sem limite | Sim | Mudanças acima do patrocinador ou que alterem o caso de negócio |

**Regra de enquadramento:** a mudança sobe de nível se **qualquer** condição estourar (custo, prazo **ou** escopo).

---

## 2. Conferência das 14 solicitações de mudança

| SM | Tipo | Custo (R$) | Prazo (du) | Decisão | Quem decidiu | Nível correto | Situação |
|---|---|---|---|---|---|---|---|
| SM-001 | Técnica | 11.600 | 10 | Rejeitada | Gerente | Patrocinador | ⚠ prazo > 5 du |
| SM-002 | **Escopo** | 11.100 | 8 | **Aprovada** | Gerente | Patrocinador | ❌ escopo + prazo |
| SM-003 | **Escopo** | 5.200 | 6 | **Aprovada** | Gerente | Patrocinador | ❌ escopo + prazo |
| SM-004 | **Escopo** | **28.900** | 5 | **Aprovada** | Gerente | Patrocinador | ❌ escopo + custo |
| SM-005 | Prazo | 14.600 | 0 | Aprovada | Gerente | Gerente | ✅ |
| SM-006 | Escopo | 49.700 | 0 | Aprovada | Patrocinador | Patrocinador | ✅ |
| SM-007 | **Escopo** | 11.700 | 6 | **Aprovada** | Gerente | Patrocinador | ❌ escopo + prazo |
| SM-008 | Técnica | 6.800 | 8 | Rejeitada | Gerente | Patrocinador | ⚠ prazo > 5 du |
| SM-009 | Escopo | 19.100 | 0 | Aprovada | Patrocinador | Patrocinador | ✅ |
| SM-010 | Escopo | 30.600 | 0 | Aprovada | Patrocinador | Patrocinador | ✅ |
| SM-011 | **Escopo** | **16.100** | 8 | **Aprovada** | Gerente | Patrocinador | ❌ escopo + custo + prazo |
| SM-012 | Escopo | 30.600 | 0 | Rejeitada | Patrocinador | Patrocinador | ✅ |
| SM-013 | Escopo | 30.600 | 0 | Aprovada | Patrocinador | Patrocinador | ✅ |
| SM-014 | **Escopo** | 12.000 | 6 | **Aprovada** | Gerente | Patrocinador | ❌ escopo + prazo |

**Resultado**
- **6 SMs aprovadas fora da alçada**, todas pelo gerente: SM-002, 003, 004, 007, 011 e 014. Somam **R$ 85.000** e **39 du** de impacto. Cinco delas são da frente preditiva e quatro foram pedidas pela coordenadora pedagógica (PI02).
- SM-004 (R$ 28.900) e SM-011 (R$ 16.100) passam também do **limite de custo** do gerente.
- SM-001 e SM-008 foram **rejeitadas** pelo gerente com prazo acima de 5 du. A rejeição não gasta dinheiro, mas a decisão também deveria ter subido ao patrocinador.
- Nenhuma SM individual precisava ir ao comitê (todas ≤ R$ 62.000 e ≤ 15 du).

## 3. Pontos que pedem decisão do comitê

1. **Acúmulo acima da reserva gerencial.** As 4 SMs aprovadas pela patrocinadora somam **R$ 130.000** (49.700 + 19.100 + 30.600 + 30.600), acima da reserva gerencial de **R$ 93.000** que ela administra. Somando as aprovadas pelo gerente, o total aprovado é **R$ 229.600**. Cada SM coube na alçada, mas o conjunto já mexe no orçamento e deveria ter sido levado ao comitê.
2. **Escopo sem alçada nenhuma.** Os 12 pedidos diretos (52 pontos) não passaram por SM. Pelo custo por ponto das SMs ágeis (SM-010: R$ 30.600 ÷ 8 pts = **R$ 3.825/pt**), equivalem a cerca de **R$ 198.900** (52 × 3.825). É uma estimativa, mas mostra um volume de comitê entrando sem decisão.
3. **Decisões paradas.** Sem a patrocinadora no comitê desde agosto, as SMs da alçada dela demoraram 22 a 29 dias (SM-013 e SM-012).

## 4. Regras propostas (fecham os conflitos)

- A SM é **enquadrada pelo PMO (P02)** antes de ir ao decisor: custo, prazo e se altera escopo. Qualquer SM de **escopo** vai no mínimo ao patrocinador.
- Rejeição segue a mesma alçada da aprovação.
- **Teto acumulado:** quando as mudanças aprovadas pelo patrocinador passarem da reserva gerencial (R$ 93.000), as próximas vão ao comitê.
- **Delegação formal** da alçada do patrocinador (por exemplo, ao diretor financeiro, PI03) enquanto ela estiver ausente, com prazo de decisão de 10 dias úteis.
- **Ratificação no próximo comitê** das 6 SMs aprovadas fora da alçada, já implantadas.
- Item que chega ao time sem SM volta ao PO e não entra na sprint.
