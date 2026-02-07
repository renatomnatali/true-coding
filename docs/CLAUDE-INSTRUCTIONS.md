# Instruções para Claude Code

Este arquivo DEVE ser lido no início de cada sessão de desenvolvimento.

---

## Regras Comportamentais Obrigatórias

### 1. PLANEJAR ANTES DE CODAR

**NUNCA** começar a implementar sem:
1. Ler as specs relevantes em `/docs/specification/`
2. Entender a jornada do usuário completa
3. Identificar onde a tarefa se encaixa no fluxo
4. Criar lista de tarefas específicas

### 2. PROTÓTIPO É A FONTE DA VERDADE

Antes de implementar qualquer UI:
1. Verificar se existe protótipo em `/prototypes/`
2. Se existe, analisar o HTML/CSS do protótipo
3. Replicar a estrutura e estilos do protótipo
4. Só então adaptar para React/Tailwind

### 3. NÃO CHUTAR

Quando algo não funciona:
1. **PARAR** - Não fazer mudanças especulativas
2. **ANALISAR** - Comparar código atual com o que funciona (protótipo, spec)
3. **ENTENDER** - Explicar o diagnóstico antes de propor solução
4. **UMA MUDANÇA** - Fazer uma correção por vez, testar, validar

### 4. EXPLICAR ANTES DE CODAR

Ao corrigir bugs ou implementar features:
1. Explicar o que vai fazer e por que
2. Esperar confirmação se for mudança significativa
3. Só então escrever código

### 5. JORNADA DO USUÁRIO PRIMEIRO

Toda implementação deve considerar:
1. De onde o usuário vem?
2. O que ele espera ver/fazer?
3. Para onde ele vai depois?
4. O que acontece se der erro?

---

## Jornadas do True Coding

### Jornada Principal (MVP)

```
1. LANDING → 2. SIGNUP → 3. DASHBOARD → 4. NEW PROJECT → 5. DISCOVERY
     ↓
6. PLANNING → 7. CONNECT GITHUB → 8. GENERATE → 9. DEPLOY → 10. LIVE
```

### Por Fase:

**DISCOVERY (Ideação)**
- Input: Usuário descreve ideia
- Output: BusinessPlan em JSON
- UI: Chat no painel direito, Workspace mostra dicas/orientação
- Transição: Quando AI detecta informação suficiente, gera BusinessPlan

**PLANNING**
- Input: BusinessPlan
- Output: TechnicalPlan em JSON
- UI: Chat continua, Workspace mostra BusinessPlan para review
- Transição: Usuário confirma plano

**CONNECTING**
- Input: Planos aprovados
- Output: GitHub conectado
- UI: Workspace mostra botão de conectar GitHub
- Transição: OAuth completo

**GENERATING**
- Input: TechnicalPlan + GitHub token
- Output: Repositório com código
- UI: Workspace mostra progresso de geração
- Transição: Código commitado

**DEPLOYING**
- Input: Repositório criado
- Output: URL de produção
- UI: Workspace mostra progresso do deploy
- Transição: Deploy concluído

**LIVE**
- Input: Projeto deployado
- Output: -
- UI: Workspace mostra links (repo, site) e métricas

---

## Referências

- Specs: `/docs/specification/`
- Protótipos: `/prototypes/`
- Princípios UX: `/docs/UX-PRINCIPLES.md`
- Knowledge Base: `/docs/KNOWLEDGE-BASE.md`

---

## Anti-Patterns (O que NÃO fazer)

1. ❌ Implementar UI sem ver protótipo
2. ❌ Fazer múltiplas mudanças especulativas
3. ❌ Ignorar specs existentes
4. ❌ Mostrar dados crus (JSON) para o usuário
5. ❌ Deixar usuário sem saber o próximo passo
6. ❌ Complexidade desnecessária (ex: fixed + relative no mesmo elemento)
