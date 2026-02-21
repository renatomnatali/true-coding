# ADR-0008: Stack Única para MVP

## Status
Aceito

## Contexto

True Coding precisa decidir se gera aplicações em múltiplas linguagens/frameworks ou foca em uma única stack.

## Decisão

Para o MVP, True Coding gerará **apenas** aplicações:
- **Linguagem**: TypeScript
- **Framework**: Next.js 15 (App Router)
- **Banco**: PostgreSQL (via Supabase ou Neon)
- **Deploy**: Netlify

## Razão

Foco em qualidade e time-to-market. Generalizar para multi-stack aumenta significativamente a complexidade antes de validar o produto.

## Análise de Alternativas

### Opção A: Stack Única (Escolhida)
- **Prós**:
  - Profundidade de conhecimento em uma stack
  - Templates mais maduros e testados
  - Debugging mais fácil
  - Time-to-market mais rápido
- **Contras**:
  - Perde clientes que querem Python, Java, Go, etc.
  - Limita mercado

### Opção B: Multi-stack
- **Prós**:
  - Mercado maior
  - Flexibilidade para clientes
- **Contras**:
  - Complexidade alta desde o início
  - Manutenção dispersa entre stacks
  - Qualidade pode ser inconsistente

## O que Mudaria se Fosse Multi-stack

| Aspecto | Stack Única | Multi-stack |
|---------|-------------|-------------|
| Templates | `templates/nextjs-basic/` | + `templates/python-fastapi/`, `templates/java-spring/`, etc. |
| IA Prompts | Conhece profundamente Next.js | Precisa conhecer múltiplos frameworks superficialmente |
| Deploy | Netlify otimizado | Precisa containers, AWS, Heroku, etc. |
| Complexidade | Baixa | Alta |
| Manutenção | Focada em um nicho | Dispersa |
| Quality Gates | Específicos para TypeScript/React | Diferentes para cada linguagem |

## Consequências

- **Positivas**:
  - Produto mais polido para o nicho Next.js
  - Desenvolvimento mais rápido
  - Menos bugs por complexidade reduzida

- **Negativas**:
  - Clientes que preferem outras stacks não usarão a plataforma
  - Aceitável para MVP - validar produto primeiro

## Revisão

Após validar o MVP com a stack única, avaliar demanda para:
1. Python (FastAPI/Django)
2. Java (Spring Boot)
3. Go
4. Outros frameworks frontend (Vue, Svelte)

Ver issue #79 para tracking de multi-stack.

## Referências

- Issue #53: Campos bloqueados no editor do Plano Técnico
- `src/lib/ai/prompts/planning.ts`: Templates de geração
- `src/lib/codegen/templates/`: Templates de código
