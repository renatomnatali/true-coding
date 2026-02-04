# ADR-0006 — Extração de JSON das respostas da IA: resilência a truncamento

**Status:** Aceito
**Data:** 2026-02
**Referências no código:** `src/lib/ai/parsers.ts` (extractJSON, repairJSON), `src/lib/ai/config.ts` (maxTokens)

---

## Contexto

Os planos (TechnicalPlan, UXPlan) são gerados pela IA como JSON dentro de blocos ` ```json ``` ` na resposta. O parser original (`extractJSON`) dependia de um regex que exigia o bloco completo com fechamento. Duas falhas recorrentes:

1. **Truncamento por limite de tokens:** O TechnicalPlan tem 9 seções aninhadas (dataModel com entidades+campos+relacionamentos, fileStructure aninhado, etc). Com `maxTokens: 4096` a resposta era cortada no meio do JSON — sem o fechamento ` ``` `, o regex não encontrava o bloco e retornava `null`.
2. **Whitespace variável:** Claude às vezes não coloca `\n` exatamente onde o regex esperava (`\n` após `json`, `\n` antes de ` ``` `).

Isso causava o erro: `"Falha ao extrair TechnicalPlan da resposta"` (500 no endpoint `/approve`).

## Decisão

Duas mudanças:

### (a) Aumentar maxTokens para planning
```typescript
planning: { maxTokens: 16384 }  // anterior: 4096
```
TechnicalPlan + texto explicativo da IA facilmente passa de 4096 tokens. 16384 dá margem confortável sem custo significativo (chamada não-streaming, uma vez por aprovação).

### (b) Tornar extractJSON resiliente a truncamento

Estratégia em 3 níveis:
1. **Bloco completo** — regex flexível que aceita whitespace variável: `` /```json\s*\n?([\s\S]*?)\n?\s*```/ ``
2. **Bloco truncado** — se encontrar `` ```json `` sem fechamento, passa pelo `repairJSON`
3. **JSON bare** — procura `{...}` diretamente, tenta parse, e se falhar passa pelo repair

`repairJSON` faz:
- Remove trailing commas antes de `}` e `]`
- Remove último key-value incompleto (string não fechada ou valor ausente)
- Fecha braces/brackets abertos na ordem correta usando uma stack

## Por que não simplesmente aumentar maxTokens?

Só aumentar tokens resolve a maioria dos casos mas não garante. Claude pode truncar por outras razões (safety filters, internal limits). O repair é uma camada de defesa — não substitui tokens adequados, mas evita 500 desnecessário quando o JSON está 95% completo.

## Consequências

- **Positivas:** Fim dos 500 `"Falha ao extrair TechnicalPlan"` na prática; parser mais robusto para qualquer fase que use `extractJSON`.
- **Negativas:** JSON "reparado" pode estar incompleto (última seção cortada). Aceito — um plano 95% completo é melhor que um erro bloqueante. O usuário pode aprovar e o sistema segue.
- **Monitoramento:** Se repair for acionado frequentemente, sinal de que maxTokens precisa revisão.
