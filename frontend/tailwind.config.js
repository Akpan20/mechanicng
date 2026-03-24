/* eslint-env node */
/** @type {import('tailwindcss').Config} */
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
        // 👇 Add these to match your CSS variables
        surface: {
          950: '#0a0a0f',   // rgb(10, 10, 15)
          900: '#0d0d16',   // rgb(13, 13, 22)
          800: '#13131a',   // rgb(19, 19, 26)
        },
        brand: {
          500: '#f97316',   // rgb(249, 115, 22)
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'), 
    require('@tailwindcss/typography')],
}