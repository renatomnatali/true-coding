# UX Spec: Representacao Visual das Secoes do UX Plan (Issue #39)

> **Autor:** UX Planning Agent
> **Data:** 12 Fev 2026
> **Status:** Proposta para validacao

---

## A. Resumo do Problema e Objetivos

### Problema do Usuario
Na fase de Planejamento, o UX Plan gera 8 secoes. Tres delas descrevem elementos visuais
(Navegacao Principal, Wireframes e Fluxos, Biblioteca de Componentes) mas sao exibidas
apenas como texto descritivo. O usuario precisa "imaginar" o layout, tornando a revisao
e aprovacao do plano menos eficaz.

### Objetivo do Usuario
Visualizar representacoes esquematicas (wireframes simplificados) de cada secao visual
diretamente no workspace, sem precisar sair da plataforma ou interpretar texto puro.

### Objetivo de Negocio
- Aumentar a confianca do usuario na aprovacao do UX Plan
- Reduzir pedidos de revisao por mal-entendidos visuais
- Diferenciar o True Coding de ferramentas que geram apenas texto

### Criterios de Sucesso
1. As 3 secoes visuais renderizam representacoes HTML/CSS/SVG baseadas no JSON da IA
2. Fidelidade "esquematica" -- wireframe simplificado, nao mockup pixel-perfect
3. Responsivo (funciona em desktop e mobile)
4. Acessivel (WCAG 2.2 AA)
5. Nao requer geracao de imagens por IA

---

## B. Premissas e Restricoes

### Fatos
- O JSON do UX Plan ja contem campos `wireframes`, `componentLibrary` e `informationArchitecture.navigation`
- O componente `UxPlanView` no `WorkspacePanel.tsx` ja renderiza todas as 8 secoes
- A stack usa React 19, Tailwind CSS e shadcn/ui
- O workspace tem largura max de `max-w-3xl` (768px)

### Hipoteses (a validar)
- **H1:** Usuarios preferem wireframes esquematicos a descricoes textuais longas
- **H2:** O campo `layout` dos wireframes contem informacao suficiente para inferir grid/disposicao
- **H3:** 3-5 variantes de componente por grupo sao suficientes para comunicar o design system

### Restricoes Tecnicas
- Sem geracao de imagens por IA (SVG/HTML/CSS renderizado no React)
- O JSON nao muda de estrutura -- a renderizacao visual e uma "camada de apresentacao"
- Performance: renderizar inline, sem lazy load complexo
- Sem dependencias externas novas (usar apenas Tailwind + SVG nativo)

---

## C. Persona

### Persona Primaria: Empreendedor Criador (usuario do True Coding)

| Campo | Detalhe |
|-------|---------|
| Nome | Ricardo Alves |
| Idade | 35 anos |
| Localizacao | Campinas, SP |
| Contexto | Tem uma ideia de app, nao e programador, esta usando True Coding para transformar a ideia em produto |
| JTBD | "Quero entender visualmente como meu app vai funcionar antes de aprovar o plano" |
| Dores | Texto puro nao comunica layout; precisa "adivinhar" como as telas vao ficar |
| Objetivos | Aprovar o UX Plan com confianca de que o resultado final sera proximo do que imagina |
| Triggers | Acabou de aprovar o Technical Plan, esta revisando o UX Plan |
| Acessibilidade | Sem necessidades especiais, mas usa celular frequentemente |

---

## D. Jornada Detalhada

### Jornada: Revisar e Aprovar Secoes Visuais do UX Plan

| Passo | Acao | Emocao | Friccao Potencial |
|-------|------|--------|-------------------|
| 1 | Ricardo aprova Technical Plan e aguarda geracao do UX Plan | Ansioso | Loading de ~2 min |
| 2 | UX Plan aparece. Scrolla pelas Personas e Jornadas (texto) | Neutro | Texto longo |
| 3 | Chega na secao "Arquitetura de Informacao" com Navegacao Principal | **Positivo** se visual, **Negativo** se so texto | Texto puro = "como isso vai ficar?" |
| 4 | Ve representacao visual da sidebar/tabs/bottom bar | Confiante | Precisa entender que e esquematico |
| 5 | Scrolla ate "Wireframes e Fluxos" | **Positivo** se ve layouts | Muito texto = desiste de ler |
| 6 | Ve wireframes esquematicos com grid, sidebar, cards | Empolgado | Layout pode nao corresponder a expectativa |
| 7 | Chega na "Biblioteca de Componentes" | **Positivo** se ve preview | Nomes de variantes sao abstratos |
| 8 | Ve preview visual de botoes, badges, cards, inputs | Confiante | Precisa distinguir variantes |
| 9 | Clica "Aprovar e Continuar" | Satisfeito | -- |

### Pontos de Recuperacao
- Se o wireframe nao corresponde a expectativa: usuario pode pedir ajustes no chat
- Se o layout inferido esta errado: texto descritivo permanece visivel como fallback

---

## E. Fluxos e Requisitos

### Happy Path
1. UX Plan e gerado com JSON completo
2. Secoes visuais renderizam automaticamente baseadas nos dados
3. Usuario scrolla, revisa, aprova

### Edge Cases
1. **JSON sem campo `layout`**: Renderizar wireframe generico com placeholder
2. **Wireframe com layout nao reconhecido**: Mostrar texto descritivo + wireframe generico
3. **Lista de componentes vazia**: Mostrar estado vazio com mensagem
4. **Navegacao com apenas 1 item**: Renderizar normalmente
5. **Tela mobile**: Wireframes empilham verticalmente, reduzem escala

### Regras de Renderizacao Visual

#### Secao 1: Navegacao Principal (`informationArchitecture.navigation`)
- Detectar padrao pelo campo `name`: "Sidebar" -> wireframe sidebar, "Bottom" -> wireframe bottom bar, "Tabs" -> wireframe tabs, "Breadcrumb" -> wireframe breadcrumb
- Cada padrao renderiza um SVG/HTML esquematico
- Label do padrao visivel abaixo do wireframe
- Fallback: texto descritivo se padrao nao reconhecido

#### Secao 2: Wireframes e Fluxos (`wireframes`)
- Detectar layout pelo campo `layout`: "Sidebar" -> grid 2 colunas, "Grid" -> grid de cards, "List" -> lista vertical, "Form" -> formulario com campos, "Map" -> area de mapa com sidebar
- Renderizar wireframe esquematico com areas cinzas representando zonas de conteudo
- Nome da tela como titulo do wireframe
- Descricao abaixo do wireframe
- Maximo 4 wireframes visiveis, scroll horizontal para mais

#### Secao 3: Biblioteca de Componentes (`componentLibrary`)
- Para cada grupo, renderizar preview visual das variantes
- "Buttons": Botoes reais com estilos diferenciados (primary, secondary, destructive, ghost)
- "Badges"/"Status": Pills coloridas com texto
- "Cards": Retangulos com borda e conteudo esquematico
- "Form Inputs"/"Inputs": Campos de formulario com label e placeholder
- Fallback para grupos nao reconhecidos: chips com nome da variante

---

## F. Especificacao UX/UI

### F.1 Navegacao Principal -- Wireframes de Padroes

#### Componente: `NavigationPreview`
- **Entrada**: Array de `{ name, description }`
- **Saida**: Grid de wireframes esquematicos (1 por padrao)

**Padroes reconhecidos:**

| Padrao (keyword no `name`) | Wireframe |
|-|-|
| `sidebar` | Retangulo vertical a esquerda (60px) + area principal. Sidebar com 5-6 linhas representando menu items. |
| `bottom` / `tab bar` | Retangulo principal + barra inferior com 4-5 circulos/quadrados representando icones |
| `tabs` / `top tabs` | Barra superior com 3-4 retangulos horizontais representando tabs + area de conteudo |
| `breadcrumb` | Barra superior fina com setas ">" entre blocos de texto |
| `hamburger` / `drawer` | Icone de hamburger no canto + overlay lateral |

**Layout do componente:**
```
[---Wireframe SVG (200x140px)---]
  Nome do Padrao (bold)
  Descricao (muted)
```

**Responsividade:**
- Desktop: grid 2 colunas
- Mobile: 1 coluna

**Estados:**
- Default: fundo `bg-gray-50`, borda `border`
- Hover: `border-blue-200` (feedback sutil)

**Microcopy:**
- Titulo da secao: "Navegacao Principal"
- Se sem dados: "Nenhum padrao de navegacao definido."

---

### F.2 Wireframes e Fluxos -- Wireframes de Telas

#### Componente: `WireframePreview`
- **Entrada**: Array de `{ name, description, layout }`
- **Saida**: Grid de wireframes esquematicos (1 por tela)

**Layouts reconhecidos (keyword no `layout`):**

| Keyword | Wireframe |
|---------|-----------|
| `sidebar` | Grid 2 colunas: barra lateral estreita + area principal |
| `card` / `grid` | Area principal com grid de 2x2 ou 3 retangulos (cards) |
| `list` / `table` | Area principal com linhas horizontais empilhadas |
| `form` | Area principal com retangulos verticais (campos) + botao abaixo |
| `map` / `mapa` | Area grande (mapa) + sidebar ou panel inferior |
| `mobile` / `app` | Viewport estreito (telefone) com header, conteudo, footer |
| `split` / `2 colunas` | Grid 50/50 |
| Generico | Retangulo com header, body, footer genericos |

**Layout do componente:**
```
[Persona Badge] [Nome da Tela] (header)
[--- Wireframe esquematico (aspect 16:10) ---]
  Descricao (muted, max 2 linhas)
  Layout: "Sidebar fixa + area principal" (code, gray)
```

**Responsividade:**
- Desktop: grid 2 colunas
- Mobile: 1 coluna, wireframes em tamanho menor

**Interacao:**
- Hover: borda azul + shadow sutil
- Click (futuro): poderia abrir modal com wireframe ampliado

**Microcopy:**
- Titulo: "Wireframes e Fluxos"
- Subtitulo: "Representacao esquematica dos layouts principais"
- Estado vazio: "Nenhum wireframe definido neste plano."
- Label do layout: prefixo "Layout:" em cinza

---

### F.3 Biblioteca de Componentes -- Preview Visual

#### Componente: `ComponentLibraryPreview`
- **Entrada**: Array de `{ name, variants: [{ name, description }] }`
- **Saida**: Secoes agrupadas com preview visual de cada variante

**Renderizacao por tipo de componente:**

| Tipo (keyword no grupo `name`) | Preview |
|-|---------|
| `button` / `botao` / `botoes` | Botoes reais renderizados com Tailwind: Primary (bg-blue-600), Secondary (border), Destructive (bg-red-500), Ghost (transparent) |
| `badge` / `status` / `tag` | Pills coloridas: cada variante com cor diferente baseada no nome (success=verde, warning=amarelo, error=vermelho, info=azul, default=cinza) |
| `card` | Retangulos com borda, titulo placeholder e texto placeholder |
| `input` / `form` / `campo` | Campos de formulario: text input com label, select com opcoes, textarea |
| `navigation` / `nav` / `menu` | Links horizontais ou verticais simulando menu |
| `modal` / `dialog` | Retangulo overlay com header, body, footer |
| Outro | Chip com nome da variante + descricao ao lado |

**Layout do componente:**
```
Nome do Grupo (bold)
[---Area de preview com fundo bg-gray-50---]
  [Preview visual] [Nome] [Descricao]
  [Preview visual] [Nome] [Descricao]
  ...
```

**Responsividade:**
- Desktop: preview e texto lado a lado
- Mobile: preview acima, texto abaixo

**Microcopy:**
- Titulo: "Biblioteca de Componentes"
- Subtitulo: "Preview das variantes de UI definidas para o projeto"
- Estado vazio: "Nenhum componente definido neste plano."

---

### F.4 Acessibilidade (WCAG 2.2 AA)

| Requisito | Implementacao |
|-----------|---------------|
| Contraste | Wireframes usam `gray-300` sobre `white` (fundo) -- ratio 2.6:1 aceitavel para decorativo. Labels usam cores com ratio >= 4.5:1 |
| Teclado | Wireframes nao sao interativos (decorativos). Labels sao texto estatico |
| Screen reader | `aria-hidden="true"` nos SVGs/divs decorativos dos wireframes. Texto descritivo permanece legivel pelo SR |
| Alt text | SVGs tem `role="img"` + `aria-label` descrevendo o wireframe (ex: "Wireframe esquematico de dashboard com sidebar e grid de cards") |
| Reducao de movimento | Hover animations usam `transition-colors` (seguro). Sem animacoes complexas |

---

## G. Mockups

### Lista de Arquivos

| Arquivo | Proposito |
|---------|-----------|
| `mockups/project/phase-2-planning/ux-visual-sections/index.html` | Hub de navegacao entre os 3 mockups |
| `mockups/project/phase-2-planning/ux-visual-sections/01-navigation-preview.html` | Preview visual da secao Navegacao Principal |
| `mockups/project/phase-2-planning/ux-visual-sections/02-wireframe-preview.html` | Preview visual da secao Wireframes e Fluxos |
| `mockups/project/phase-2-planning/ux-visual-sections/03-component-library-preview.html` | Preview visual da secao Biblioteca de Componentes |

### Estados Simulados
- Default: wireframes com dados do JSON de exemplo (App Delivery)
- Estado vazio: toggle para simular JSON sem dados em cada secao
- Responsivo: redimensionar browser para ver comportamento mobile

---

## H. Checklist Final

- [x] Persona tem JTBD e dores claras
- [x] Jornada cobre happy path e edge cases
- [x] Cada secao visual tem todos os estados especificados
- [x] Microcopy completa e acionavel
- [x] Mockups demonstram as interacoes-chave
- [x] Checklist de acessibilidade completo
- [x] Premissas claramente marcadas
- [x] Proximos passos de validacao definidos

---

## I. Proximos Passos

1. **Validar hipoteses H1-H3** com 3-5 usuarios (teste de 5 segundos nos wireframes)
2. **Implementar componentes React** seguindo esta spec:
   - `NavigationPreview` -- secao de navegacao
   - `WireframePreview` -- secao de wireframes
   - `ComponentLibraryPreview` -- secao de biblioteca
3. **Enriquecer o prompt da IA** (`UX_PLAN_SYSTEM_PROMPT`) para gerar `layout` mais estruturado
4. **Testar com JSONs reais** de 5 projetos diferentes para validar cobertura de padroes
5. **Medir metricas**: tempo de revisao do UX Plan antes vs depois

---

**Proximo passo sugerido:** Implementar o componente `WireframePreview` primeiro, pois e o de maior impacto visual e valida a abordagem de parsing do campo `layout`.
