// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';
import { KpiCard } from './UsageBar.jsx';

describe('KpiCard', function() {
  afterEach(function() {
    cleanup();
    vi.restoreAllMocks();
  });

  it('mantem centavos pt-BR na animacao do resultado', async function() {
    vi.stubGlobal('requestAnimationFrame', function(cb) { return setTimeout(function() { cb(performance.now()); }, 16); });
    vi.stubGlobal('cancelAnimationFrame', function(id) { clearTimeout(id); });

    var view = render(<KpiCard label="Resultado Liquido" value="R$ 12,50" headline={true} heading="h2"/>);

    await waitFor(function() {
      expect(view.container.querySelector('[aria-hidden="true"]')).toHaveTextContent('12,50');
    }, { timeout: 1000 });
    expect(view.container.querySelector('[aria-hidden="true"]')).not.toHaveTextContent('1.250,00');
  });
});
