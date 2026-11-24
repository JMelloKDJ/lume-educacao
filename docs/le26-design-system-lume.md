# LE-26 — Branding, Paleta de Cores e Design System da Lume Educação

**Ticket Jira:** `LE-26` (Épico `LE-1` — Arquitetura e Produto)  
**Requisitos vinculados:** `R12` e `D17`  
**Equipe PMO:** Esquadrão Linha de Base  
**Protótipo publicado (Web e Android):** https://tocoamora-sousa.github.io/lume-educacao/  
**Tokens estruturados:** [`prototipo/design-tokens.json`](../prototipo/design-tokens.json)  

---

## 1. Posicionamento de Marca e Arquitetura Visual

A **Lume Educação** nasce em Feira de Santana (BA) com a missão de democratizar a preparação para o ENEM no interior da Bahia e em sua rede de 12 escolas parceiras. O nome *Lume* remete a **clareza, luz e direção** nos estudos.

### Separação Estratégica de Marcas
Para evitar poluição visual e garantir um **MLP (Minimum Lovable Product)** prazeroso para o estudante, o Design System separa claramente duas camadas:
1. **Produto — Lume Educação (Telas `T00` a `T13`):** estética **Clean Pastel** minimalista, leve, jovem e de baixo cansaço visual para longas jornadas de estudo (com **Modo Claro** e **Modo Escuro**).
2. **Governança PMO — Esquadrão Linha de Base (Tela `T14` e Gaveta R12):** cabeçalho executivo em **Azul-Marinho (`#081628`) e Dourado (`#D4AF37`)**, reservado exclusivamente à visão de Comitê Diretor, Controle de Data, Cenários (`C1`–`C6`) e rastreabilidade do backlog (`LU-xxx`).

### Personalidade e Tom de Voz
- **Acolhedor e sem culpa:** incentiva a constância (ex.: *"Sem culpa por atrasar! Reagende suas tarefas em 1 toque"*).
- **Claro e inclusivo:** linguagem direta, adaptada à realidade de estudantes do interior e conexões móveis limitadas (Modo 240p).
- **Transparente:** foco em autonomia (cancelamento em 1 clique e consentimento LGPD claro para menores de 18 anos).

---

## 2. Logotipo e Símbolo

O símbolo da Lume Educação é um **prisma de luz de 4 pontas** branco inscrito em um ícone arredondado (`border-radius: 12px`) com gradiente diagonal do **Lavanda (`#7C5CFC`)** para o **Pêssego Solar (`#FF9472`)**, acompanhado pela tipografia `Plus Jakarta Sans ExtraBold`.

- **Área de respiro:** mínima de `25%` da altura do ícone ao redor da marca.
- **Aplicações:** fundo claro (`#FAF9FC`), fundo escuro (`#0E0F1A`) e ícone de atalho no celular Android.

---

## 3. Paleta de Cores (Tokens)

### 3.1 Cores Principais da Marca
| Nome | Token | HEX | Uso Principal |
| :--- | :--- | :---: | :--- |
| **Lavanda Principal** | `color.brand.lavender_600` | `#6747E6` | Botões primários (CTA), item ativo no menu, links |
| **Lavanda Luminosa** | `color.brand.lavender_500` | `#7C5CFC` | Gráficos, gradientes do logo, foco em campos e sliders |
| **Lavanda Suave** | `color.brand.lavender_50` | `#F5F2FF` | Cartões de destaque, badges de curso e chips da IA |
| **Pêssego Solar** | `color.brand.peach_500` | `#FF7A59` | Ofensiva/constância, receita no gráfico, alertas de atenção |
| **Pêssego Suave** | `color.brand.peach_50` | `#FFF5F0` | Cards motivacionais e avisos de reagendamento (`LU-160`) |

### 3.2 Cores Semânticas e Áreas do ENEM
| Área / Função | Token | Cor Forte | Fundo Pastel | Aplicação nas Telas |
| :--- | :--- | :---: | :---: | :--- |
| **Sucesso / Natureza / 240p** | `semantic.mint` | `#10B981` | `#EEFBF5` | Tarefas concluídas, economia de dados, status *Entregue* |
| **Info / Linguagens / Escolas** | `semantic.sky` | `#0EA5E9` | `#F0F8FF` | Catálogo de aulas, Painel Escolar (`T10`), Cenário `C4` |
| **Alerta / Humanas / TRI** | `semantic.butter` | `#EAB308` | `#FFFDF0` | Status *Em andamento*, Simulado (`T06`), folha de redação |
| **Erro / Redação / Corte C3** | `semantic.rose` | `#F43F5E` | `#FFF1F5` | Ateliê de Redação (`T07`), cancelamento, itens cortados no `C3` |

### 3.3 Superfícies — Modo Claro vs. Modo Escuro (*Clean Pastel Night*)
| Elemento | Modo Claro (`Light`) | Modo Escuro (`Dark`) |
| :--- | :---: | :---: |
| **Fundo da Página (`canvas`)** | `#FAF9FC` | `#0E0F1A` |
| **Cartões (`card`)** | `#FFFFFF` | `#171929` |
| **Bordas sutis (`border`)** | `#EFEFF4` | `#272A40` |
| **Texto Principal (`ink`)** | `#1E1B2E` | `#F1F0F9` |
| **Texto Secundário (`muted`)** | `#6E6B7B` | `#A2A1B8` |

### 3.4 Camada Executiva PMO (Esquadrão Linha de Base)
- **Azul-Marinho Tático:** `#081628` (cabeçalho da Galeria `T14` e topo da Gaveta de Backlog).
- **Dourado Linha de Base:** `#D4AF37` (frisos executivos, selo `R12 / D17` e destaques do Comitê).

---

## 4. Tipografia

- **Display / Títulos:** `Plus Jakarta Sans` (pesos `600`, `700`, `800`) — moderna, geométrica e jovem; usada nos títulos de telas, KPIs e logotipo.
- **Interface / Leitura Longa:** `Inter` (pesos `400`, `500`, `600`, `700`) — alta legibilidade em telas pequenas de smartphones Android, ideal para enunciados do ENEM e redações.
- **Monospace:** `JetBrains Mono` / sistema — usada em códigos de rastreabilidade (`LU-151`, `LU-235`), cronômetro do simulado (`T06`) e código Pix (`T12`).

---

## 5. Geometria, Elevação e Componentes

- **Cantos arredondados (friendly & mobile-first):**
  - Cartões padrão (`.card-mlp`): `24px` (`rounded-3xl`)
  - Banners/Hero de abertura: `28px`
  - Botões principais, filtros e badges: `9999px` (estilo *pill*)
  - Campos de entrada (`input`, `select`, `textarea`): `16px` (`rounded-2xl`)
- **Glassmorphism:** barra flutuante superior e barra inferior Android com transparência (`82%`) e desfoque `blur(18px)`.
- **Iconografia:** biblioteca **Lucide Icons** (traço limpo de `2px`), sempre dentro de containers pastéis arredondados.
- **Visualização de dados:** **Chart.js** com barras arredondadas (`borderRadius: 12`) e curvas suaves (`tension: 0.35`), adaptando automaticamente cores de grade e rótulos no Modo Escuro.

---

## 6. Diretrizes Multiplataforma (Web e Android)

- **Web Desktop (`>= 1024px`):** largura máxima de `1380px`, menu lateral flutuante (`240px`) agrupado por jornada e grades de 2 a 4 colunas.
- **Android Mobile (`< 640px` + simulador `392×790px`):** coluna única confortável para toque, menu lateral em gaveta expansível e **dock flutuante inferior** com os 5 atalhos mais usados (`Plano`, `Aulas`, `Treino`, `Tutor IA` e `Galeria`).
- **Conformidade e Acessibilidade:** alto contraste de texto em ambos os temas, feedback imediato via *toast* suave e modo de economia de dados (`240p`) destacado nas telas de mídia.
