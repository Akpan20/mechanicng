import forms from '@tailwindcss/forms'
import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',

  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],

  theme: {
    extend: {
      colors: {
        background: '#ffffff',
        foreground: '#0a0a0f',

        // optional dark tokens
        dark: {
          background: '#0a0a0f',
          foreground: '#e5e7eb',
        },
      },
    },
  },

  plugins: [
    forms,
    typography,
  ],
}