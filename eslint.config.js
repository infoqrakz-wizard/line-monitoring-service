import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  // Ignore generated and external folders
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'design/**',
      '*.tsbuildinfo',
    ],
  },

  // TypeScript and React settings for TS files
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      reactPlugin.configs.flat.recommended,
      reactPlugin.configs.flat['jsx-runtime'],
      eslintConfigPrettier,
    ],
    languageOptions: {
      parserOptions: {
        // Use projectService to auto-detect tsconfig for type-aware linting
        projectService: true,
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      "@typescript-eslint/no-explicit-any": "warn"
    },
  },

  // Plain JS/JSX support (in case any exists)
  {
    files: ['**/*.{js,jsx}'],
    extends: [js.configs.recommended, reactPlugin.configs.flat.recommended, eslintConfigPrettier],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  }
);


