import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import ThemeToggle from '../components/ThemeToggle.jsx';
import Offline from '../components/Offline.jsx';

describe('ThemeToggle', function() {
  it('renderiza botao dark qdo theme=dark', function() {
    render(React.createElement(ThemeToggle, { theme: 'dark', onToggle: function() {} }));
    var btn = screen.getByRole('button');
    expect(btn).toBeInTheDocument();
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
    screen.getByRole('button').click();
    expect(calls.length).toBe(1);
  });
});

describe('Offline', function() {
  it('renderiza null qdo online', function() {
    var container = render(React.createElement(Offline));
    expect(container.container.innerHTML).toBe('');
  });
});
