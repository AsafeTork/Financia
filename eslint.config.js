import reactHooks from 'eslint-plugin-react-hooks';
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import globals from 'globals';
import tseslint from 'typescript-eslint';

var SRC = { files: ['src/**/*.{js,jsx,ts,tsx}'] };

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', 'src/test/gen/', 'supabase/', '*.config.*'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    settings: { react: { version: '18' } },
    languageOptions: { globals: { ...globals.browser, ...globals.es2021 } },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { args: 'none', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-extra-boolean-cast': 'off',
      'react/no-unescaped-entities': 'off',
    },
  },
);
