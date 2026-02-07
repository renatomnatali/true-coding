# Design Tokens - Mapeamento para Tailwind

> **OBRIGATÓRIO**: Consultar este arquivo ANTES de implementar qualquer componente visual.
> Fonte: `mockups/css/tokens.css`

---

## Cores

### Primary (AZUL, não violet!)

| Token CSS              | Hex       | Tailwind           |
|------------------------|-----------|--------------------|
| --color-primary        | #2563eb   | `blue-600`         |
| --color-primary-hover  | #1d4ed8   | `blue-700`         |
| --color-primary-light  | #dbeafe   | `blue-100`         |

### Success

| Token CSS              | Hex       | Tailwind           |
|------------------------|-----------|--------------------|
| --color-success        | #10b981   | `emerald-500`      |
| --color-success-hover  | #059669   | `emerald-600`      |
| --color-success-light  | #d1fae5   | `emerald-100`      |

### Error

| Token CSS              | Hex       | Tailwind           |
|------------------------|-----------|--------------------|
| --color-error          | #ef4444   | `red-500`          |
| --color-error-hover    | #dc2626   | `red-600`          |
| --color-error-light    | #fee2e2   | `red-100`          |

### Warning

| Token CSS              | Hex       | Tailwind           |
|------------------------|-----------|--------------------|
| --color-warning        | #f59e0b   | `amber-500`        |
| --color-warning-hover  | #d97706   | `amber-600`        |
| --color-warning-light  | #fef3c7   | `amber-100`        |

### Neutral (Gray)

| Token CSS              | Hex       | Tailwind           |
|------------------------|-----------|--------------------|
| --color-gray-50        | #f9fafb   | `gray-50`          |
| --color-gray-100       | #f3f4f6   | `gray-100`         |
| --color-gray-200       | #e5e7eb   | `gray-200`         |
| --color-gray-300       | #d1d5db   | `gray-300`         |
| --color-gray-400       | #9ca3af   | `gray-400`         |
| --color-gray-500       | #6b7280   | `gray-500`         |
| --color-gray-600       | #4b5563   | `gray-600`         |
| --color-gray-700       | #374151   | `gray-700`         |
| --color-gray-800       | #1f2937   | `gray-800`         |
| --color-gray-900       | #111827   | `gray-900`         |

### Semânticos

| Uso                    | Token                  | Tailwind           |
|------------------------|------------------------|--------------------|
| Background primário    | --color-bg-primary     | `bg-white`         |
| Background secundário  | --color-bg-secondary   | `bg-gray-50`       |
| Background terciário   | --color-bg-tertiary    | `bg-gray-100`      |
| Texto primário         | --color-text-primary   | `text-gray-900`    |
| Texto secundário       | --color-text-secondary | `text-gray-600`    |
| Texto terciário        | --color-text-tertiary  | `text-gray-500`    |
| Borda padrão           | --color-border         | `border-gray-200`  |
| Borda hover            | --color-border-hover   | `border-gray-300`  |

---

## Espaçamento

| Token CSS    | Valor  | Tailwind                        |
|--------------|--------|---------------------------------|
| --space-1    | 4px    | `p-1`, `m-1`, `gap-1`           |
| --space-2    | 8px    | `p-2`, `m-2`, `gap-2`           |
| --space-3    | 12px   | `p-3`, `m-3`, `gap-3`           |
| --space-4    | 16px   | `p-4`, `m-4`, `gap-4`           |
| --space-5    | 20px   | `p-5`, `m-5`, `gap-5`           |
| --space-6    | 24px   | `p-6`, `m-6`, `gap-6`           |
| --space-8    | 32px   | `p-8`, `m-8`, `gap-8`           |
| --space-10   | 40px   | `p-10`, `m-10`, `gap-10`        |
| --space-12   | 48px   | `p-12`, `m-12`, `gap-12`        |
| --space-16   | 64px   | `p-16`, `m-16`, `gap-16`        |

---

## Tipografia

### Tamanhos

| Token CSS        | Valor  | Tailwind      |
|------------------|--------|---------------|
| --font-size-xs   | 11px   | `text-[11px]` |
| --font-size-sm   | 13px   | `text-[13px]` |
| --font-size-base | 14px   | `text-sm`     |
| --font-size-lg   | 16px   | `text-base`   |
| --font-size-xl   | 18px   | `text-lg`     |
| --font-size-2xl  | 24px   | `text-2xl`    |
| --font-size-3xl  | 30px   | `text-3xl`    |

### Pesos

| Token CSS              | Valor | Tailwind         |
|------------------------|-------|------------------|
| --font-weight-normal   | 400   | `font-normal`    |
| --font-weight-medium   | 500   | `font-medium`    |
| --font-weight-semibold | 600   | `font-semibold`  |
| --font-weight-bold     | 700   | `font-bold`      |

---

## Layout

| Token CSS          | Valor  | Uso                              |
|--------------------|--------|----------------------------------|
| --sidebar-width    | 240px  | `w-60` ou `w-[240px]`            |
| --chat-width       | 380px  | `w-96` ou `w-[380px]`            |
| --header-height    | 64px   | `h-16` ou `h-[64px]`             |

---

## Border Radius

| Token CSS            | Valor    | Tailwind        |
|----------------------|----------|-----------------|
| --border-radius-sm   | 4px      | `rounded`       |
| --border-radius-md   | 6px      | `rounded-md`    |
| --border-radius-lg   | 8px      | `rounded-lg`    |
| --border-radius-xl   | 12px     | `rounded-xl`    |
| --border-radius-full | 9999px   | `rounded-full`  |

---

## Sombras

| Token CSS    | Tailwind      |
|--------------|---------------|
| --shadow-sm  | `shadow-sm`   |
| --shadow-md  | `shadow-md`   |
| --shadow-lg  | `shadow-lg`   |
| --shadow-xl  | `shadow-xl`   |

---

## Z-Index

| Token CSS      | Valor | Tailwind       |
|----------------|-------|----------------|
| --z-dropdown   | 1000  | `z-[1000]`     |
| --z-modal      | 2000  | `z-[2000]`     |
| --z-tooltip    | 3000  | `z-[3000]`     |
| --z-toast      | 4000  | `z-[4000]`     |

---

## Exemplos de Uso

### Botão Primary
```tsx
<button className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2">
  Enviar
</button>
```

### Card
```tsx
<div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
  Conteúdo
</div>
```

### Texto com hierarquia
```tsx
<h1 className="text-3xl font-bold text-gray-900">Título</h1>
<p className="text-sm text-gray-600">Descrição secundária</p>
<span className="text-[11px] text-gray-500">Meta info</span>
```
