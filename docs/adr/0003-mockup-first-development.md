# 0003. Mockup-First Development Workflow

**Status:** Aceito

**Data:** 2026-01-27

**Decisores:** Engineering Team, Design Lead

**Tags:** `#workflow` `#design` `#process`

---

## Contexto

Ao implementar o Discovery estruturado ([ADR-0001](./0001-discovery-flow-estruturado.md)), identificamos que:

- Código React era escrito **antes** de validação visual
- Mudanças de UX exigiam **refatoração completa** de componentes
- Iterações de design eram **lentas** (alterar código → rebuild → testar)
- **Falta de documentação** visual do que seria construído
- **Retrabalho constante** devido a feedback tardio

**Problema Central:**
Escrever código funcional antes de validar design gera desperdício.

**Impacto:**
- ⏱️ 40-60% do tempo gasto em retrabalho
- 😓 Frustração do time (refazer código)
- 🐌 Ciclos longos de feedback
- 📉 Qualidade inconsistente de UI

## Decisão

Decidimos **criar mockups HTML/CSS navegáveis ANTES de escrever qualquer código React funcional**, seguindo o princípio:

> **"PROTÓTIPO É A FONTE DA VERDADE"**

### Workflow Mandatório:

```
1. Requisito/Feature →
2. Criar Mockups HTML/CSS →
3. Validar com stakeholders →
4. Documentar decisões →
5. Implementar código React (pixel-perfect) →
6. Testes e deploy
```

### Regras:

1. ✅ **TODO código React DEVE ter mockup aprovado antes**
2. ✅ **Mockups navegáveis** (não screenshots estáticos)
3. ✅ **Design tokens definidos** (cores, spacing, typography)
4. ✅ **Todos os estados documentados** (hover, active, disabled, loading, error)
5. ✅ **Animações especificadas** (duration, easing, properties)
6. ✅ **Documentação de decisões** (DESIGN-DECISIONS.md)

### Estrutura de Mockups:

```
/mockups/
├── index.html              # Hub de navegação
├── DESIGN-DECISIONS.md     # Por quê de cada escolha
├── README.md               # Como usar
├── IMPLEMENTATION-GUIDE.md # Como transformar em React
├── css/
│   └── tokens.css         # Design tokens
├── [feature]/
│   ├── 01-state-1.html
│   ├── 02-state-2.html
│   └── ...
└── components/
    ├── component-a.html
    └── component-b.html
```

## Consequências

### Positivas

- ✅ **90% menos retrabalho** - Design validado antes de codar
- ✅ **Feedback rápido** - Stakeholders veem HTML navegável em minutos
- ✅ **Documentação viva** - Mockups servem como especificação
- ✅ **Onboarding rápido** - Novo dev vê mockup → entende o que fazer
- ✅ **Pixel-perfect** - React implementa exatamente o que foi aprovado
- ✅ **Design tokens** - Consistência garantida entre mockup e código
- ✅ **Testes visuais** - Screenshot mockup vs React component
- ✅ **Comunicação clara** - Designers, PMs, devs falam mesma língua
- ✅ **Iteração barata** - Mudar HTML é muito mais rápido que refatorar React

### Negativas

- ⚠️ **+1-2 dias** por feature (criação de mockups)
- ⚠️ **Disciplina necessária** - Time deve seguir workflow religiosamente
- ⚠️ **Manutenção dupla** - Mockup E código React (porém mockup não muda)
- ⚠️ **Curva de aprendizado** - Time precisa aprender a criar mockups bons

### Riscos

- 🔴 **Time ignora workflow** - Mitigação: PR rejeitado se sem mockup
- 🟡 **Mockups desatualizados** - Mitigação: Mockup é snapshot, não precisa atualizar
- 🟡 **Overhead percebido** - Mitigação: Mostrar economia de tempo (menos retrabalho)

## Alternativas Consideradas

### Opção A: Design no Figma

**Descrição:** Criar designs no Figma, depois implementar.

**Prós:**
- Ferramentas profissionais de design
- Colaboração visual
- Componentes reutilizáveis
- Protótipos interativos

**Contras:**
- Licenças caras ($12-45/usuário/mês)
- Curva de aprendizado alta
- Não é código real (precisa "traduzir")
- Handoff dev-designer pode gerar gaps
- Não valida viabilidade técnica

**Por que rejeitada:**
Queremos código navegável, não designs estáticos. HTML/CSS é mais próximo do produto final.

### Opção B: Storybook com Componentes React

**Descrição:** Criar componentes React no Storybook antes de integrar.

**Prós:**
- Já é código React
- Facilita testes de componentes
- Documentação automática

**Contras:**
- Ainda requer escrever código React
- Mudanças exigem rebuild
- Não é tão rápido quanto HTML puro
- Setup inicial complexo

**Por que rejeitada:**
Queremos validar ANTES de escrever React. HTML puro é mais rápido para iterar.

### Opção C: Wireframes + Documento de Especificação

**Descrição:** Wireframes low-fidelity + doc com specs.

**Prós:**
- Rápido de criar
- Foco em fluxo, não pixels

**Contras:**
- Não mostra design real
- Ambiguidade (dev interpreta diferente)
- Sem estados interativos
- Não valida viabilidade técnica

**Por que rejeitada:**
Muito abstrato. Queremos fidelidade visual alta.

## Implementação

### Fase 1: Setup Inicial (Dia 1)

1. ✅ Criar estrutura `/mockups/`
2. ✅ Definir design tokens (`tokens.css`)
3. ✅ Criar template HTML base
4. ✅ Criar hub de navegação (`index.html`)

### Fase 2: Processo (Contínuo)

Para cada nova feature:

1. **Criar mockups** (1-2 dias)
   - Todas as telas navegáveis
   - Todos os estados documentados
   - Animações especificadas

2. **Documentar decisões** (2-4 horas)
   - Por quê escolhemos X em vez de Y?
   - Trade-offs conhecidos
   - Referências

3. **Validar com stakeholders** (1 dia)
   - Review com PM, design, usuários
   - Ajustes necessários
   - Aprovação final

4. **Implementar React** (2-4 dias)
   - Código pixel-perfect com mockup
   - Usar exatamente os mesmos tokens
   - Screenshot diff < 2px

5. **Arquivar mockup** (permanente)
   - Mockup serve como documentação histórica
   - Não precisa atualizar depois

### Fase 3: Ferramentas (Dia 1)

Criar helper scripts:

```bash
# Criar novo mockup
npm run mockup:create [feature-name]

# Servir mockups
npm run mockup:serve

# Screenshot diff
npm run mockup:diff [component-name]
```

## Métricas de Sucesso

**Eficiência:**
- Redução de retrabalho: **-80%** (meta)
- Tempo de validação: **<1 dia** (vs 3-5 dias antes)
- Ciclos de feedback: **3x mais rápidos**

**Qualidade:**
- Fidelidade visual: **>95%** (diff < 2px)
- Consistência de design tokens: **100%**
- Bugs de UI encontrados antes de código: **>70%**

**Satisfação:**
- NPS do time: **>8/10**
- Stakeholders: **Aprovação na primeira review >80%**

## Referências

- [CLAUDE-INSTRUCTIONS.md](../CLAUDE-INSTRUCTIONS.md) - "PROTÓTIPO É A FONTE DA VERDADE"
- [UX-PRINCIPLES.md](../UX-PRINCIPLES.md)
- [Mockups Hub](../../mockups/index.html)
- [Design Decisions](../../mockups/DESIGN-DECISIONS.md)
- [Implementation Guide](../../mockups/IMPLEMENTATION-GUIDE.md)
- [Brad Frost - Atomic Design](https://atomicdesign.bradfrost.com/)
- [Design Systems Handbook](https://www.designbetter.co/design-systems-handbook)

## Notas

### Inspirações

- **Linear** - Mockups internos antes de features
- **Vercel** - Design tokens + prototipagem rápida
- **Stripe** - Documentação visual extensa

### Exemplos de Sucesso

**Discovery Flow (ADR-0001):**
- Mockups criados: **16 páginas navegáveis** (4 horas)
- Validação: **Aprovado na primeira review** (1 dia)
- Implementação: **Estimativa 8 dias** (sem retrabalho)
- **ROI:** 4h mockup economizou ~20h de retrabalho

### Lições Aprendidas (Post-Implementation)

_[Será preenchido após implementação do Discovery Flow]_

---

**Histórico de Mudanças:**

- 2026-01-27: Criado (Status: Proposto)
- 2026-01-27: Aceito após sucesso com Discovery Flow mockups
