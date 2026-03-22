// eslint.config.js
import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tsEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,

  {
    files: ['**/*.{js,jsx,ts,tsx}'],

    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      '@typescript-eslint': tsEslint,
    },

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        React: 'readonly',
        ReactDOM: 'readonly',
      },
    },

    settings: {
      react: { version: 'detect' },
    },

    rules: {
      // ✅ React Hooks & Refresh
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // ✅ PropTypes (optional)
      'react/prop-types': 'off',

      // ✅ Disable base ESLint no-unused-vars to avoid conflicts with TS version
      'no-unused-vars': 'off',

      // ✅ TypeScript-aware unused vars rule with underscore prefix support
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',      // Ignore unused params like _lat, _lng
          varsIgnorePattern: '^_',      // Ignore unused variables like _unused
          caughtErrorsIgnorePattern: '^_', // Ignore unused catch params
          ignoreRestSiblings: true,     // Allow { used, ...rest } patterns
        },
      ],

      // ➕ Add your custom rules below
      // '@typescript-eslint/explicit-function-return-type': 'warn',
    },

    ignores: [
      'supabase/functions/**',
      'dist/**',
      'node_modules/**',
      '*.config.js', // optional: ignore config files if desired
    ],
  },
];