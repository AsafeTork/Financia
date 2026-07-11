// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import ThemeToggle from '../shared/ui/ThemeToggle.jsx';
import Offline from '../shared/ui/Offline.jsx';

describe('ThemeToggle', function() {
  afterEach(function() { cleanup(); });

  it('renderiza botao dark qdo theme=dark', function() {
    render(React.createElement(ThemeToggle, { theme: 'dark', onToggle: function() {} }));
    var btn = screen.getByRole('button');
    expect(btn.getAttribute('aria-pressed')).toBe('true');
  });

  it('renderiza botao light qdo theme=light', function() {
    render(React.createElement(ThemeToggle, { theme: 'light', onToggle: function() {} }));
    var btn = screen.getByRole('button');
    expect(btn.getAttribute('aria-pressed')).toBe('false');
  });

  it('chama onToggle ao clicar', function() {
    var calls = [];
    render(React.createElement(ThemeToggle, { theme: 'light', onToggle: function() { calls.push(1); } }));
    screen.getAllByRole('button')[0].click();
    expect(calls.length).toBe(1);
  });
});

describe('Offline', function() {
  it('renderiza null qdo online', function() {
    var container = render(React.createElement(Offline));
    expect(container.container.innerHTML).toBe('');
  });
});
