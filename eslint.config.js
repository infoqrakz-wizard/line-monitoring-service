import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  prettier,

  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ['./tsconfig.json'],
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: { react, 'react-hooks': reactHooks },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-misused-promises': 'off',
      'max-len': ['error', {
        code: 120,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
      }],
      'indent': ['error', 4, { SwitchCase: 1 }],
      'react/jsx-indent': ['error', 4],
      'react/jsx-indent-props': ['error', 4],
      // Object formatting rules
      'object-property-newline': ['error', { allowAllPropertiesOnSameLine: false }],
      'object-curly-newline': ['error', {
        multiline: true,
        consistent: true,
      }],
      // Additional popular rules
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
      'no-useless-escape': 'error',
      'no-duplicate-imports': 'error',
      'no-unused-vars': 'off', // TypeScript handles this
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'no-multiple-empty-lines': ['error', { max: 1 }],
      'no-trailing-spaces': 'error',
      'eol-last': 'error',
    },
    settings: { react: { version: 'detect' } },
  },
];






// module.exports = {
//   root: true,
//   env: {
//     browser: true,
//     es2022: true,
//     node: true,
//   },
//   extends: [
//     'eslint:recommended',
//     '@typescript-eslint/recommended',
//     '@typescript-eslint/recommended-requiring-type-checking',
//     'plugin:react/recommended',
//     'plugin:react/jsx-runtime',
//     'plugin:react-hooks/recommended',
//     'prettier',
//   ],
//   parser: '@typescript-eslint/parser',
//   parserOptions: {
//     ecmaVersion: 2022,
//     sourceType: 'module',
//     project: './tsconfig.json',
//   },
//   plugins: [
//     '@typescript-eslint',
//     'react',
//     'react-hooks',
//   ],
//   settings: {
//     react: {
//       version: 'detect',
//     },
//   },
//   rules: {
//     'no-console': ['warn', { allow: ['warn', 'error'] }],
//     'react-hooks/rules-of-hooks': 'error',
//     'react-hooks/exhaustive-deps': 'warn',
//     '@typescript-eslint/no-explicit-any': 'warn',
//     '@typescript-eslint/no-unsafe-assignment': 'warn',
//     '@typescript-eslint/no-misused-promises': 'off',
//     'max-len': ['error', {
//       code: 120,
//       ignoreUrls: true,
//       ignoreStrings: true,
//       ignoreTemplateLiterals: true,
//     }],
//     // Indentation rule
//     'indent': ['error', 4, {
//       SwitchCase: 1,
//     }],
//     // Object formatting rules
//     'object-property-newline': ['error', { allowAllPropertiesOnSameLine: false }],
//     'object-curly-newline': ['error', {
//       multiline: true,
//       consistent: true,
//     }],
//     // Additional popular rules
//     'prefer-const': 'error',
//     'no-var': 'error',
//     'object-shorthand': 'error',
//     'prefer-template': 'error',
//     'no-useless-escape': 'error',
//     'no-duplicate-imports': 'error',
//     'no-unused-vars': 'off', // TypeScript handles this
//     '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
//     'eqeqeq': ['error', 'always'],
//     'curly': ['error', 'all'],
//     'no-multiple-empty-lines': ['error', { max: 2 }],
//     'no-trailing-spaces': 'error',
//     'eol-last': 'error',
//   },
//   ignorePatterns: [
//     'dist/**',
//     'node_modules/**',
//     'coverage/**',
//     'design/**',
//     '*.tsbuildinfo',
//   ],
// };


