import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',

        // TRC-14.1 — tokens do mockup /Spec/Jornada Coleta inicial/prototipo.html
        // Namespaces dedicados (brand-, feedback-, surface, ink, line) para nao
        // colidir com o design system shadcn/ui ja consumido pelos componentes.
        brand: {
          primary: '#2563eb',
          'primary-hover': '#1d4ed8',
          'primary-light': '#dbeafe',
          'primary-lighter': '#eff6ff',
        },
        feedback: {
          success: '#10b981',
          'success-hover': '#059669',
          'success-light': '#d1fae5',
          warning: '#f59e0b',
          'warning-hover': '#b45309',
          'warning-light': '#fef3c7',
          error: '#ef4444',
          'error-light': '#fee2e2',
        },
        surface: {
          DEFAULT: '#ffffff',
          canvas: '#f9fafb',
          muted: '#f3f4f6',
          hover: '#f3f4f6',
        },
        ink: {
          DEFAULT: '#111827',
          secondary: '#4b5563',
          tertiary: '#6b7280',
          quaternary: '#9ca3af',
        },
        line: {
          DEFAULT: '#e5e7eb',
          strong: '#d1d5db',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',

        // TRC-14.1 — raios do mockup
        'brand-sm': '4px',
        'brand-md': '6px',
        'brand-lg': '8px',
        'brand-xl': '12px',
      },
      boxShadow: {
        // TRC-14.1 — shadows do mockup
        'brand-sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'brand-md':
          '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
        'brand-lg':
          '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        bounce: {
          '0%, 60%, 100%': { transform: 'translateY(0)', opacity: '0.4' },
          '30%': { transform: 'translateY(-4px)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 240ms ease both',
        'slide-up': 'slideUp 300ms ease both',
        'slide-in-right': 'slideInRight 250ms ease both',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'typing-bounce': 'bounce 1.2s infinite ease-in-out',
      },
    },
  },
  plugins: [],
}

export default config
