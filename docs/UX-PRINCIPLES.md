# Principios de UX - True Coding

Regras que DEVEM ser seguidas em toda a aplicacao.

---

## 1. NUNCA deixe o usuario adivinhar

**Regra:** Toda acao deve ter feedback visual imediato e claro.

**Exemplos de violacao:**
- Mostrar apenas texto quando o usuario precisa ver um layout
- Criar um projeto e mostrar uma pagina vazia
- Processar algo sem mostrar progresso

**Como corrigir:**
- Use previews visuais, nao descricoes em texto
- Sempre mostre o proximo passo claro
- Feedback de loading para qualquer acao > 200ms

---

## 2. Guie o usuario pela jornada

**Regra:** O usuario deve sempre saber onde esta e o que fazer em seguida.

**Implementacao:**
- Progress bar/stepper visivel
- CTAs claros em cada etapa
- Empty states com instrucoes acionaveis

---

## 3. Mobile-first, sempre

**Regra:** Toda interface deve funcionar em mobile primeiro.

**Breakpoints:**
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

---

## 4. Acessibilidade nao e opcional

**Regra:** WCAG 2.1 AA como minimo.

**Checklist:**
- [ ] Contraste de cores adequado
- [ ] Navegacao por teclado
- [ ] Labels em todos os inputs
- [ ] Aria-labels onde necessario
- [ ] Focus states visiveis

---

## 5. Feedback imediato

**Regra:** Toda interacao deve ter resposta visual.

**Tempos maximos:**
- Hover/Focus: instantaneo
- Click feedback: < 100ms
- Loading indicator: aparecer em < 200ms
- Operacao completa: notificar sempre

---

## 6. Erros claros e acionaveis

**Regra:** Mensagens de erro devem dizer O QUE deu errado e COMO resolver.

**Ruim:** "Erro ao processar"
**Bom:** "Nao foi possivel conectar ao GitHub. Verifique suas credenciais e tente novamente."

---

## 7. Consistencia visual

**Regra:** Mesmos padroes em toda a aplicacao.

- Mesmos espacamentos
- Mesmos border-radius
- Mesmas cores para mesmos significados
- Mesmos componentes para mesmas funcoes

---

## 8. Prototipar antes de implementar

**Regra:** Para mudancas significativas de UI, criar prototipo visual primeiro.

**Processo:**
1. Criar HTML estatico em `/prototypes/`
2. Revisar com stakeholder
3. Aprovar layout
4. Implementar em React

---

## 9. Entender Flexbox antes de alinhar

**Regra:** Antes de mudar alinhamento CSS, verificar a direcao do flex.

**O problema:**
`justify-*` e `items-*` tem comportamentos INVERTIDOS dependendo da direcao:

| Direcao | `justify-*` controla | `items-*` controla |
|---------|---------------------|-------------------|
| `flex` (row) | Horizontal | Vertical |
| `flex-col` | Vertical | Horizontal |

**Erro comum:**
Mudar `justify-center` para `justify-start` pensando que vai alinhar ao topo, mas na verdade move para a esquerda (em flex row).

**Como evitar:**
1. Identificar se o container usa `flex` ou `flex-col`
2. Escolher a propriedade correta:
   - Para alinhar ao TOPO em `flex-col`: use `justify-start`
   - Para alinhar ao TOPO em `flex` (row): use `items-start`
3. Testar visualmente antes de commitar

---

## Checklist de Review

Antes de mergear qualquer PR com mudancas de UI:

- [ ] Usuario sabe onde esta? (navegacao clara)
- [ ] Usuario sabe o que fazer? (CTAs visiveis)
- [ ] Tem feedback de loading?
- [ ] Funciona em mobile?
- [ ] Erros sao claros?
- [ ] Contraste de cores ok?
- [ ] Navegavel por teclado?
