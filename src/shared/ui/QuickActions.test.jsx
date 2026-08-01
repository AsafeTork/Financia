// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import QuickActions from './QuickActions.jsx';
import { consumeQuickIntent, clearQuickIntent, getQuickIntent } from '../../lib/quickIntent.js';

var BRAND = { color: '#002f59' };

function renderQA(view, onNav) {
  return render(React.createElement(QuickActions, { view: view, onNav: onNav || function() {}, brand: BRAND }));
}

describe('QuickActions', function() {
  afterEach(function() { cleanup(); clearQuickIntent(); });

  it('nao renderiza em telas fora da lista', function() {
    var { container } = renderQA('report');
    expect(container.innerHTML).toBe('');
    var { container: c2 } = renderQA('settings');
    expect(c2.innerHTML).toBe('');
  });

  it('renderiza FAB nas telas principais', function() {
    var { container } = renderQA('dashboard');
    expect(screen.getByTestId('quick-actions-fab')).toBeTruthy();
    expect(container.querySelector('[role="menu"]')).toBeNull();
  });

  it('abre o menu ao clicar no FAB', async function() {
    var user = userEvent.setup();
    renderQA('income');
    expect(screen.queryByRole('menu')).toBeNull();
    await user.click(screen.getByTestId('quick-actions-fab'));
    expect(screen.getByRole('menu')).toBeTruthy();
    expect(screen.getByTestId('quick-action-income')).toBeTruthy();
    expect(screen.getByTestId('quick-action-settings')).toBeTruthy();
  });

  it('fecha o menu ao clicar fora', async function() {
    var user = userEvent.setup();
    renderQA('income');
    await user.click(screen.getByTestId('quick-actions-fab'));
    expect(screen.getByRole('menu')).toBeTruthy();
    await user.click(document.body);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('fecha o menu com Escape', async function() {
    var user = userEvent.setup();
    renderQA('income');
    await user.click(screen.getByTestId('quick-actions-fab'));
    expect(screen.getByRole('menu')).toBeTruthy();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('Nova Venda navega para income e emite intencao', async function() {
    var user = userEvent.setup();
    var navs = [];
    renderQA('dashboard', function(v) { navs.push(v); });
    await user.click(screen.getByTestId('quick-actions-fab'));
    await user.click(screen.getByTestId('quick-action-income'));
    expect(navs).toEqual(['income']);
    expect(consumeQuickIntent('income')).not.toBeNull();
  });

  it('Nova Despesa navega para expense e emite intencao', async function() {
    var user = userEvent.setup();
    var navs = [];
    renderQA('dashboard', function(v) { navs.push(v); });
    await user.click(screen.getByTestId('quick-actions-fab'));
    await user.click(screen.getByTestId('quick-action-expense'));
    expect(navs).toEqual(['expense']);
    expect(consumeQuickIntent('expense')).not.toBeNull();
  });

  it('Novo Produto navega para inventory e emite intencao product', async function() {
    var user = userEvent.setup();
    var navs = [];
    renderQA('dashboard', function(v) { navs.push(v); });
    await user.click(screen.getByTestId('quick-actions-fab'));
    await user.click(screen.getByTestId('quick-action-product'));
    expect(navs).toEqual(['inventory']);
    expect(consumeQuickIntent('product')).not.toBeNull();
  });

  it('Configuracoes navega para settings sem emitir intencao', async function() {
    var user = userEvent.setup();
    var navs = [];
    renderQA('dashboard', function(v) { navs.push(v); });
    await user.click(screen.getByTestId('quick-actions-fab'));
    await user.click(screen.getByTestId('quick-action-settings'));
    expect(navs).toEqual(['settings']);
    expect(getQuickIntent()).toBeNull();
  });
});
