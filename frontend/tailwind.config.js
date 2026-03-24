/* eslint-env node */
/** @type {import('tailwindcss').Config} */
import forms from '@tailwindcss/forms'
import typography from '@tailwindcss/typography'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          500: '#f97316',
        },

        // ── Surface colors — read from CSS variables so they flip on .dark ──
        surface: {
          950: 'rgb(var(--color-surface-950) / <alpha-value>)',
          900: 'rgb(var(--color-surface-900) / <alpha-value>)',
          800: 'rgb(var(--color-surface-800) / <alpha-value>)',
        },

        // ── Semantic tokens ──────────────────────────────────────────────────
        background: 'var(--bg-body)',
        foreground: 'var(--text-body)',
        muted:      'var(--text-muted)',
        border:     'var(--border-color)',
      },

      fontFamily: {
        sans: ['Sora', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },

      boxShadow: {
        'glow-brand': '0 0 15px rgba(249, 115, 22, 0.5)',
      },
    },
  },
  plugins: [forms, typography],
}