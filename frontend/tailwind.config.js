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
        background: '#ffffff',
        foreground: '#0a0a0f',
        dark: {
          background: '#0a0a0f',
          foreground: '#e5e7eb',
        },
        surface: {
          950: '#0a0a0f',
          900: '#0d0d16',
          800: '#13131a',
        },
        brand: {
          500: '#f97316',
        },
      },
    },
  },
  plugins: [forms, typography],
}