import reactHooks from 'eslint-plugin-react-hooks';
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import globals from 'globals';

var SRC = { files: ['src/**/*.js', 'src/**/*.jsx'] };

export default [
  Object.assign({}, SRC, js.configs.recommended),
  Object.assign({}, SRC, react.configs.flat.recommended),
  Object.assign({}, SRC, {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  }),
  Object.assign({}, SRC, {
    settings: { react: { version: '18' } },
    languageOptions: { globals: { ...globals.browser, ...globals.es2021 } },
    rules: {
      'no-unused-vars': ['warn', { args: 'none', varsIgnorePattern: '^_' }],
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-extra-boolean-cast': 'off',
      'react/no-unescaped-entities': 'off',
    },
  }),
  {
    ignores: ['dist/', 'node_modules/', 'src/test/gen/', 'supabase/'],
  },
];
