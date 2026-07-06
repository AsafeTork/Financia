import reactHooks from 'eslint-plugin-react-hooks';
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import globals from 'globals';

export default [
  js.configs.recommended,
  react.configs.flat.recommended,
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    settings: { react: { version: '18' } },
    languageOptions: { globals: { ...globals.browser, ...globals.es2021 } },
    rules: {
      'no-unused-vars': ['warn', { args: 'none', varsIgnorePattern: '^_' }],
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', 'src/test/gen/', 'supabase/'],
  },
];
