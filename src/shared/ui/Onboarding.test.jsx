// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import Onboarding from './Onboarding.jsx';

var BRAND = { color: '#002f59' };
var KEY = 'financia_onboarding_progress_u1';

function setup(overrides) {
  var props = Object.assign({ brand: BRAND, needsName: false, needsPhone: false, uid: 'u1' }, overrides || {});
  var calls = [];
  var onSave = props.onSave || function() { return Promise.resolve(); };
  props.onSave = function(data) { calls.push(data); return Promise.resolve(onSave(data)); };
  return { calls: calls, props: props };
}

describe('Onboarding', function() {
  afterEach(function() { cleanup(); });

  it('renderiza boas-vindas com indicador de progresso', function() {
    var { props } = setup({ needsName: true });
    render(React.createElement(Onboarding, props));
    expect(screen.getByText('Bem-vindo ao Financia')).toBeTruthy();
    expect(screen.getByRole('progressbar')).toBeTruthy();
    expect(screen.getByText('Começando')).toBeTruthy();
  });

  it('avanca para o passo nome ao clicar Começar', async function() {
    var user = userEvent.setup();
    var { props } = setup({ needsName: true });
    render(React.createElement(Onboarding, props));
    await user.click(screen.getByRole('button', { name: 'Começar' }));
    expect(screen.getByText('Passo 1 de 1')).toBeTruthy();
    expect(screen.getByLabelText('Nome da empresa')).toBeTruthy();
  });

  it('valida nome vazio sem chamar onSave', async function() {
    var user = userEvent.setup();
    var { props, calls } = setup({ needsName: true });
    render(React.createElement(Onboarding, props));
    await user.click(screen.getByRole('button', { name: 'Começar' }));
    await user.click(screen.getByRole('button', { name: 'Concluir' }));
    expect(screen.getByText('Informe o nome da sua empresa.')).toBeTruthy();
    expect(calls.length).toBe(0);
  });

  it('conclui chamando onSave com o nome', async function() {
    var user = userEvent.setup();
    var { props, calls } = setup({ needsName: true });
    render(React.createElement(Onboarding, props));
    await user.click(screen.getByRole('button', { name: 'Começar' }));
    await user.type(screen.getByLabelText('Nome da empresa'), 'Padaria do João');
    await user.click(screen.getByRole('button', { name: 'Concluir' }));
    expect(calls.length).toBe(1);
    expect(calls[0]).toEqual({ name: 'Padaria do João' });
  });

  it('pular por agora finaliza com dados vazios', async function() {
    var user = userEvent.setup();
    var { props, calls } = setup({ needsName: true });
    render(React.createElement(Onboarding, props));
    await user.click(screen.getByRole('button', { name: 'Pular por agora' }));
    expect(calls.length).toBe(1);
    expect(calls[0]).toEqual({});
  });

  it('salva progresso no localStorage entre etapas', async function() {
    var user = userEvent.setup();
    var { props } = setup({ needsName: true, needsPhone: true });
    render(React.createElement(Onboarding, props));
    await user.click(screen.getByRole('button', { name: 'Começar' }));
    expect(screen.getByText('Passo 1 de 2')).toBeTruthy();
    await user.type(screen.getByLabelText('Nome da empresa'), 'Padaria');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByText('Passo 2 de 2')).toBeTruthy();
    expect(screen.getByText('Telefone (com DDD)')).toBeTruthy();
    expect(localStorage.getItem(KEY)).toContain('"step":2');
    expect(localStorage.getItem(KEY)).toContain('Padaria');
  });

  it('restaura progresso salvo em nova sessao', function() {
    localStorage.setItem(KEY, JSON.stringify({ step: 2, name: 'Padaria', phone: { e164: '', national: '', valid: false } }));
    var { props } = setup({ needsName: true, needsPhone: true });
    render(React.createElement(Onboarding, props));
    expect(screen.getByText('Passo 2 de 2')).toBeTruthy();
    expect(screen.getByText('Telefone (com DDD)')).toBeTruthy();
  });

  it('mostra banner de erro amigavel quando onSave falha e preserva valores', async function() {
    var user = userEvent.setup();
    var { props, calls } = setup({ needsName: true, onSave: function() { return Promise.reject(new Error('net')); } });
    render(React.createElement(Onboarding, props));
    await user.click(screen.getByRole('button', { name: 'Começar' }));
    await user.type(screen.getByLabelText('Nome da empresa'), 'Padaria do João');
    await user.click(screen.getByRole('button', { name: 'Concluir' }));
    var alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('net');
    expect(calls.length).toBe(1);
    expect(screen.getByLabelText('Nome da empresa').value).toBe('Padaria do João');
  });

  it('usa mensagem personalizada quando onSave rejeita com message', async function() {
    var user = userEvent.setup();
    var { props } = setup({ needsName: true, onSave: function() { return Promise.reject(new Error('Limite atingido')); } });
    render(React.createElement(Onboarding, props));
    await user.click(screen.getByRole('button', { name: 'Começar' }));
    await user.type(screen.getByLabelText('Nome da empresa'), 'Padaria');
    await user.click(screen.getByRole('button', { name: 'Concluir' }));
    var alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Limite atingido');
  });

  it('valida telefone invalido no passo de contato', async function() {
    var user = userEvent.setup();
    var { props, calls } = setup({ needsPhone: true });
    render(React.createElement(Onboarding, props));
    await user.click(screen.getByRole('button', { name: 'Começar' }));
    await user.click(screen.getByRole('button', { name: 'Concluir' }));
    expect(screen.getByText('Informe um telefone válido com DDD.')).toBeTruthy();
    expect(calls.length).toBe(0);
  });

  it('conclui com telefone valido', async function() {
    var user = userEvent.setup();
    var { props, calls } = setup({ needsPhone: true });
    render(React.createElement(Onboarding, props));
    await user.click(screen.getByRole('button', { name: 'Começar' }));
    await user.type(screen.getByTestId('phone-input-field'), '11999999999');
    await user.click(screen.getByRole('button', { name: 'Concluir' }));
    expect(calls.length).toBe(1);
    expect(calls[0]).toEqual({ phone: '+5511999999999' });
  });

  it('fluxo unico (sem dados necessarios) conclui direto', async function() {
    var user = userEvent.setup();
    var { props, calls } = setup({});
    render(React.createElement(Onboarding, props));
    await user.click(screen.getByRole('button', { name: 'Começar' }));
    expect(calls.length).toBe(1);
    expect(calls[0]).toEqual({});
  });

  it('limpa progresso salvo ao concluir', async function() {
    var user = userEvent.setup();
    localStorage.setItem(KEY, JSON.stringify({ step: 1, name: 'X', phone: null }));
    var { props } = setup({ needsName: true, onSave: function() { return Promise.resolve(); } });
    render(React.createElement(Onboarding, props));
    await user.click(screen.getByRole('button', { name: 'Concluir' }));
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});
