# Bloco Story-Goals-Antigoals

Template estrutural que usamos no início de toda jornada (Regra 1 do CLAUDE.md: Story → Jornada → Gherkin). Substitui o bloco tradicional "Persona + Objetivo" por algo mais denso e estratégico.

## Forma

```markdown
## Story-Goals-Antigoals

### User Story
Como [PERSONA específica com contexto],
quero [intenção em linguagem natural],
para [resultado/valor percebido pela persona].

### Objetivos de produto (o que queremos)
1. [Resultado observável/mensurável]
2. [...]
3. [...]

### Anti-objetivos (o que NÃO queremos)
- [Comportamento ou resultado que a jornada deve evitar]
- [Armadilha conhecida de UX que não pode acontecer]
- [Escopo adjacente que está fora]
```

## Por que existe

O bloco resolve três problemas que a gente teve no projeto:

**1. User Story sozinha não ancora decisões de produto.**
"Como Maria quero X para Y" diz o que a persona quer. Não diz o que o produto precisa atingir pra considerar a jornada bem-sucedida, nem o que conta como "fracasso". Duas jornadas diferentes podem ter a mesma user story e comportamentos aceitáveis radicalmente diferentes.

**2. Objetivos de produto ficavam em documentos separados (PRD, roadmap, Notion).**
Quando o designer/dev ia mapear a jornada, os objetivos ficavam em outra aba — e quase nunca eram lidos. Resultado: jornadas que entregavam a intenção da persona mas violavam objetivos de produto silenciosamente (exemplo: jornada de checkout otimizada pra "Maria concluir compra" mas que aumentava abandono porque ignorava o objetivo de produto "reduzir suporte pós-venda").

**3. O que NÃO fazer não era escrito em lugar nenhum.**
Non-goals moram em cabeças. Quando surge nova pessoa no time, o que parecia óbvio sobre "o que essa feature nunca deve virar" se perde. Jornada sem anti-objetivo convida scope creep.

## Referências (origens conhecidas, não inventado agora)

**User Story formato Connextra ("Como X, quero Y, para Z")**
- Mike Cohn, *User Stories Applied* (2004). XP/Agile consagrado.

**Ligação user outcome ↔ product outcome**
- Clayton Christensen, *Competing Against Luck* — Jobs-to-be-Done.
- Anthony Ulwick, *Outcome-Driven Innovation*.
- Teresa Torres, *Continuous Discovery Habits* — Opportunity Solution Tree. Torres formaliza a árvore: outcome de negócio → outcomes de usuário → oportunidades → experimentos.

**Non-goals / "What we won't do"**
- Amazon Working Backwards (PR-FAQ) — seção "What's NOT in scope" é obrigatória.
- Basecamp Shape Up (Ryan Singer, 2019) — "no-gos" fazem parte do pitch de ciclo de 6 semanas.
- Templates modernos de RFC/PRD (Stripe, Notion, Linear, Figma) — seção "Non-goals" / "Out of scope" sempre presente.
- Google Design Sprint (Jake Knapp) — "HMW + non-goals" no dia 1.

**Acceptance criteria negativo**
- BDD (Dan North) — cenários de erro e edge não podem ser "descobertos depois".

## O que este bloco fez de novo

Nada revolucionário. A inovação é **achatamento**: em vez de user story num cartão, objetivos num roadmap e non-goals num wiki, juntamos os três no topo do mesmo documento de jornada. Três consequências práticas:

1. **Leitura única**: quem vai mapear passos lê os três ao mesmo tempo.
2. **Obriga reflexão estratégica antes da tática**: você não consegue escrever passos se ainda não decidiu anti-objetivos.
3. **Revisões de jornada referenciam explicitamente**: "Esse passo viola o anti-objetivo 3" é um argumento concreto em code review.

## Quando usar

Toda jornada no projeto True Coding (`mockups/**/journeys/*.md` e equivalentes) começa com este bloco. Sem exceção.

Tamanho esperado:
- User Story: 1 sentença Connextra.
- Objetivos: 3-5 itens, cada um uma linha observável.
- Anti-objetivos: 2-5 itens, cada um um comportamento ou escopo concreto.

Se o bloco inteiro passa de 20 linhas, provavelmente há duas jornadas disfarçadas de uma.

## Regras de qualidade

- Persona específica ("Maria, dona de cafeteria de bairro, não-técnica") — não "usuário".
- Objetivos observáveis ("Maria sai sentindo que foi entendida") — não desejos abstratos ("excelência").
- Anti-objetivos concretos ("clicar quick replies sem pensar") — não negações vagas ("não queremos UX ruim").
- Pelo menos um anti-objetivo deve descrever um **comportamento de usuário indesejado**, não só escopo técnico.

## Histórico

- 2026-04-15 — Bloco adotado a partir do trabalho do Discovery do True Coding. Incorporado à skill global `journey-mapping` v1.2.0.
- 2026-04-24 — Regra 7 do CLAUDE.md formaliza as 3 sub-regras de processo do TRC-307 (SGA obrigatório em Epic/Story novo; SPEDITE exige impacto de usuário; sub-task referencia épico pai).

## Inventário 2026-04 — épicos SPEDITE da Initiative TRC-INI-001 (TRC-307 Fase 1)

Fechamento do critério 1 do TRC-307 ("todos os épicos SPEDITE classificados Epic/Story/Task"). Todos os épicos da Initiative TRC-INI-001 Especificação foram auditados em 2026-04-23/24 e todos qualificam como **Epic** (jornada coerente de semanas). Nenhum estava disfarçado de Epic quando era Story/Task — a classificação original manteve-se.

| ID | Título | Tipo | SGA | Classificação |
|---|---|---|---|---|
| TRC-05 | Pivô Spec MVP — ocultar Generation, lançar Spec-as-a-Service | Epic | Retrofit (empreendedor/PM) | Mantido |
| TRC-06 | Export + manifest MCP | Epic | Retrofit (developer externo consumindo bundle) | Mantido |
| TRC-07 | Congelamento de Generation (roadmap v2) | Epic | Tech-only (não-derivável) | Mantido |
| TRC-08 | Extrair PlanningPhase (superseded by TRC-18) | Epic | — | Canceled |
| TRC-14 | Fundação: design system, logo, shell, schema | Epic | Tech-only (não-derivável) | Mantido |
| TRC-15 | Jornada: Product Context (wizard 9 campos) | Epic | Original (Maria completando wizard) | Mantido |
| TRC-16 | Jornada: Dashboard + criação de projeto | Epic | Original (Maria chegando em dashboard vazio) | Mantido |
| TRC-17 | Jornada: Discovery one-shot | Epic | Compacto + link journey-discovery.md | Mantido |
| TRC-18 | Jornada: Planos em blocos | Epic | Compacto + link journey-primeiros-planos.md | Mantido |
| TRC-19 | Jornada: Inbox + admission gates | Epic | Compacto + links journey-decisoes/riscos/sugestoes.md | Mantido |

**Conclusão**: 9 épicos ativos + 1 cancelado; todos qualificam como Epic. Dois são tech-only (TRC-07, TRC-14) e receberam callout explícito "no story — não-derivável" conforme TRC-307. Os demais têm SGA preenchido (recuperável ou retrofit).
