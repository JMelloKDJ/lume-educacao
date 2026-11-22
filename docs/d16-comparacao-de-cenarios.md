# D16 — Comparação de cenários: valor e decisão

**Projeto:** Plataforma de estudos por assinatura para o ENEM — Lume Educação
**Data de status:** 13/11/2026
**Fontes:** tabela 02 (caso de negócio), tabela 43 (cenários), tabela 01 (TMA 15% a.a. e custo do atraso de R$ 5.800/du), dossiê seção M7 (término, ENT e meses de atraso de C1, C3 e C4) e convenções 16, 22 e 23 do dicionário.

> Este documento cobre os três cenários que o dossiê pede na folha M7: **C1, C3 e C4**. C2, C5 e C6 dependem da previsão pela rede e das tabelas 44 a 46 (convenções 21 e 22), que saem do simulador do grupo. Na seção 5 está o que falta para fechar esses três.

---

## 1. Ponto de partida: o caso de negócio aprovado

Com o fluxo da tabela 02 sem ajustes, o projeto tinha **VPL de R$ 1.156.935** e **payback de 3,63 anos**.

Na data de status, mesmo seguindo como está (C1), o VPL cai para **−R$ 11.587**. Duas coisas explicam a queda:
- o **estouro de custo**: a ENT de R$ 4.168.735 fica R$ 1.084.843 acima do ONT e entra como investimento no ano 0;
- o **atraso de 2,73 meses**, que tira R$ 96.233 do primeiro ano de operação.

## 2. Resultado dos três cenários

| | C1 Seguir como está | C3 Cortar escopo | C4 Ampliar o escopo |
|---|---|---|---|
| Quem defende | Diretor-fundador (PI01) | Diretor financeiro (PI03) | Diretor-fundador (PI01) |
| Término previsto | 08/04/2027 | 25/03/2027 | 23/04/2027 |
| Dias úteis além do contrato (29/01/2027) | 46 | 37 | 56 |
| ENT (R$) | 4.168.735 | 4.070.571 | 4.371.552 |
| Variação do benefício | 0% | −1,4% | +6,0% |
| Custo operacional adicional | — | — | +R$ 58.100/ano |
| **VPL (15% a.a.)** | **−11.587** | **−59.654** | **+222.831** |
| Payback simples | 4,41 anos | 4,44 anos | 4,27 anos |
| Custo do atraso (du × 5.800) | 266.800 | 214.600 | 324.800 |
| **Resultado (VPL − atraso)** | **−278.387** | **−274.254** | **−101.969** |
| Diferença para C1 | — | +4.133 | **+176.418** |

O passo a passo das contas está na folha manuscrita M7.

## 3. Leitura

1. **Nenhum dos três cenários cobre o custo do atraso.** Todos têm resultado negativo. O valor do projeto já foi corroído pelo estouro de custo e pelo atraso, e a decisão agora é sobre qual cenário perde menos.
2. **Cortar escopo (C3) quase não muda nada.** O corte economiza R$ 98.164 de ENT e 9 du de atraso, mas a perda de 1,4% do benefício anula quase tudo. O ganho sobre C1 é de só R$ 4.133.
3. **Ampliar o escopo (C4) é o único cenário com VPL positivo** e o de melhor resultado, com R$ 176.418 a mais que C1. Isso vale mesmo sendo o cenário mais caro (+R$ 202.817 de ENT) e o mais atrasado (+10 du).
4. **A vantagem do C4 depende do +6% de benefício.** Cada ponto percentual de benefício vale cerca de R$ 113.400 de VPL. O C4 continua melhor que C1 enquanto o ganho de benefício for de pelo menos **4,4%**, uma folga de 1,6 ponto. Esse número de +6% vem do proponente, a diretora-fundadora, que hoje está ausente do comitê.
5. **O C4 aumenta um problema que já existe.** O projeto tem escopo entrando sem controle: 12 pedidos diretos e 6 SMs aprovadas fora da alçada (ver D6). Ampliar o escopo agora pressiona ainda mais a equipe de operação (P09, ver D1), que é quem faz o lançamento na segunda praça.

## 4. Recomendação ao comitê

**Entre os três cenários, aprovar o C4 com condições.** O C3 não deve ser escolhido: ele protege o caixa no curto prazo, mas não melhora o resultado.

Condições para o C4:
- validar a premissa de **+6% de benefício** com dados do piloto (funil e conversão) antes da entrada em operação. Abaixo de 4,4%, o C4 deixa de valer a pena;
- passar a ampliação pelo **comitê** como mudança formal, porque altera o caso de negócio (alçada do comitê, tabela 05);
- congelar os pedidos diretos ao backlog durante a ampliação;
- combinar o C4 com o C2 (recuperar o prazo), que a tabela 43 permite. Cada dia útil recuperado vale R$ 5.800, e o C4 é o cenário mais atrasado.

## 5. Para fechar C2, C5 e C6 no simulador

| Cenário | O que o simulador precisa calcular |
|---|---|
| C2 Recuperar o prazo | Nova previsão de término com a compressão da tabela 44 e o reforço da tabela 46. A rampa é de 1 sprint (o reforço rende a partir da segunda sprint). Depois, a ENT pela convenção 22. |
| C5 Trocar a solução | Previsão sem o épico Tutor com IA. Benefício −1,0% e licença de R$ 15.100/ano no custo operacional. |
| C6 Duas ondas | 50% do benefício antecipado a partir do gatilho N05. O atraso efetivo é a média ponderada entre o atraso do gatilho e o atraso do término (convenção 23). |

Os números de controle de C1, C3 e C4 (término, ENT e meses de atraso) servem para validar o simulador antes de rodar esses três.
