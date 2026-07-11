import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';

Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_APP_URL: 'https://test.example.com',
  },
  writable: true,
  configurable: true,
});