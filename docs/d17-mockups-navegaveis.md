# D17 — Mockups Navegáveis e Protótipo Interativo (Requisito R12)

**Projeto:** Lume Educação  
**Equipe PMO:** Esquadrão Linha de Base  
**Data de Corte:** 13/11/2026  

## 1. Acesso ao Protótipo
- **Link público interativo (Web e Android):** https://tocoamora-sousa.github.io/lume-educacao/
- **Código-fonte no repositório:** [`prototipo/index.html`](../prototipo/index.html)

## 2. Resumo da Entrega
O protótipo foi construído como um **MLP (Minimum Lovable Product)** responsivo para **Web e Android** (com alternância ao vivo entre desktop e simulador mobile, além de **Modo Escuro**), reunindo **15 telas navegáveis (`T00` a `T14`)** — superando o mínimo exigido de 12 telas — e cobrindo **100% dos 8 épicos** do projeto.

### Recursos de Governança PMO Integrados (R12)
- **Controle de Data:** alterna o status das telas e dos itens do backlog entre `07/08/2026` (R1 MVP), `30/10/2026` (fim da Sprint 13 — `95/134` itens concluídos), `13/11/2026` (status atual — `100/141` itens concluídos, `306` pontos) e previsões de `R2` e `R3`.
- **Simulador de Cenários (`C1` a `C6`):** demonstra visualmente o impacto de cada decisão do Comitê Diretor (ex.: corte do Tutor com IA e itens `COULD` no `C3`, inclusão de 2ª praça no `C4`, troca por API de mercado no `C5` e abertura em duas ondas após R2 no `C6`).
- **Gaveta de Rastreabilidade (`LU-xxx`):** acessível em qualquer tela, listando os itens do backlog vinculados, release, sprint (incluindo `S14`) e alertas para **pedidos diretos fora do controle de mudanças** (como `LU-235` e `LU-239`).
- **Modo App Puro:** botão na barra superior que oculta os controles de governança para apresentar a experiência limpa do estudante.

## 3. Matriz de Telas × Épicos × Releases

| Tela | Nome | Jornada | Épico Relacionado | Release | Destaques Interativos |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **T00** | Login, Cadastro (LGPD) & Perfil | Acesso & Conta | Cadastro e plano de estudos | R1 | Acesso em 1 clique por perfil e consentimento LGPD para menores de 18 anos |
| **T01** | Diagnóstico & Catálogo de Cursos | Jornada do Aluno | Cadastro e plano de estudos | R1 | Busca em 55+ cursos ENEM/SISU, rotina diária e prioridades |
| **T02** | Meu Plano Semanal Focado | Jornada do Aluno | Cadastro e plano de estudos | R1 | Checklist vivo, criação de metas, ajuste semanal (`LU-151`) e reagendamento (`LU-160`) |
| **T03** | Biblioteca de Videoaulas | Jornada do Aluno | Videoaulas | R1 | Filtros por área do ENEM, busca e selo de consumo em MB |
| **T04** | Player Modo Pouca Internet | Jornada do Aluno | Videoaulas | R1 | Qualidade 240p/360p/720p (economia de dados para 3G), download offline e caderno |
| **T05** | Prática de Questões ENEM | Jornada do Aluno | Banco de questões e simulados | R1 | 6 questões comentadas com gabarito instantâneo e envio direto para a IA |
| **T06** | Simulado Cronometrado & TRI | Jornada do Aluno | Banco de questões e simulados | R1 | Mini-simulado de 5 áreas com cronômetro e gráfico TRI recalculado |
| **T07** | Ateliê & Correção de Redação | Jornada do Aluno | Correção de redação | R2 | Devolutiva em 5 competências (0–1000) + pré-avaliador automático de texto |
| **T08** | Trilhas, Ofensiva & Novidades | Jornada do Aluno | Trilhas e gamificação | R2 | Desafio jogável com ganho de XP, ranking das 12 escolas e Novidades (`LU-235`) |
| **T09** | Tutor Lume IA 24h & Monitor | Jornada do Aluno | Tutor com IA | R2 | Regras ENEM, calculadora passo a passo, conexão opcional Gemini (sem chave no código), avaliação (`LU-159`) e monitor humano (`LU-158`) |
| **T10** | Painel do Coordenador Escolar | Escola & Pais | Painel da escola e responsáveis | R3 | Métricas das 12 escolas parceiras, alerta de evasão e tema customizado (`LU-239`) |
| **T11** | Espaço dos Pais & Responsáveis | Escola & Pais | Painel da escola e responsáveis | R3 | Constância semanal, evolução de redação e alertas WhatsApp/e-mail |
| **T12** | Planos, Cupom & Cancelamento | Gestão & Assinatura | Assinatura e gestão | R1 | 7 dias grátis, Pix copia-e-cola, cupom (`LU-232`) e cancelamento em 1 clique |
| **T13** | Painel Lume — Operação & Piloto | Gestão & Assinatura | Assinatura e gestão | R2 | Funil real de 14 semanas (10/08 a 13/11), exportação CSV (`LU-225`) e Diretoria (`LU-233`) |
| **T14** | Galeria PMO — R12 & Cenários | Governança PMO | Todos os 8 épicos | R1–R3 | Visão executiva consolidada, controle de data, cenários `C1`–`C6` e Tabela 45 |

## 4. Segurança e Boas Práticas
- Nenhuma chave de API ou credencial está armazenada no repositório. A conexão opcional com o Google Gemini na tela `T09` solicita a chave diretamente na sessão local do navegador do usuário.
