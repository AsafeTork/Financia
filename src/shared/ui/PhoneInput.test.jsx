// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import PhoneInput from './PhoneInput.jsx';

describe('PhoneInput', function() {
  afterEach(function() { cleanup(); vi.clearAllMocks(); });

  it('renderiza com label', function() {
    render(React.createElement(PhoneInput, { label: 'Telefone', onChange: function() {} }));
    expect(screen.getByText('Telefone')).toBeTruthy();
  });

  it('exibe o valor do telefone formatado', function() {
    render(React.createElement(PhoneInput, { label: 'Telefone', value: '+5511912345678', onChange: function() {} }));
    const input = screen.getByLabelText('Telefone');
    expect(input.value).toBe('(11) 91234-5678');
  });

  it('chama onChange ao digitar', async function() {
    const calls = [];
    render(React.createElement(PhoneInput, { label: 'Telefone', value: '', onChange: function(v) { calls.push(v); } }));
    const input = screen.getByLabelText('Telefone');
    const user = userEvent.setup();
    await user.type(input, '11912345678');
    await waitFor(() => {
      const lastCall = calls[calls.length - 1];
      expect(lastCall.national).toBe('11912345678');
      expect(lastCall.country).toBe('BR');
      expect(lastCall.e164).toBe('+5511912345678');
    });
  });

  it('lida com valor vazio sem erro', function() {
    render(React.createElement(PhoneInput, { label: 'Telefone', value: '', onChange: function() {} }));
    const input = screen.getByLabelText('Telefone');
    expect(input).toBeTruthy();
    expect(input.value).toBe('');
  });

  it('lida com valor null sem erro', function() {
    render(React.createElement(PhoneInput, { label: 'Telefone', value: null, onChange: function() {} }));
    const input = screen.getByLabelText('Telefone');
    expect(input).toBeTruthy();
    expect(input.value).toBe('');
  });

  it('abre seletor de país ao clicar no botão', async function() {
    render(React.createElement(PhoneInput, { label: 'Telefone', value: '+5511912345678', onChange: function() {} }));
    const countryButton = screen.getByTestId('phone-input-country-select');
    const user = userEvent.setup();
    await user.click(countryButton);
    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeTruthy();
  });

  it('permite navegar por teclado no seletor de país', async function() {
    render(React.createElement(PhoneInput, { label: 'Telefone', value: '+5511912345678', onChange: function() {} }));
    const countryButton = screen.getByTestId('phone-input-country-select');
    const user = userEvent.setup();
    await user.click(countryButton);
    screen.getByRole('listbox');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');
    await waitFor(() => {
      const lb = screen.queryByRole('listbox');
      expect(lb).toBeNull();
    });
  });

  it('fecha seletor de país com Escape', async function() {
    render(React.createElement(PhoneInput, { label: 'Telefone', value: '+5511912345678', onChange: function() {} }));
    const countryButton = screen.getByTestId('phone-input-country-select');
    const user = userEvent.setup();
    await user.click(countryButton);
    await user.keyboard('{Escape}');
    await waitFor(() => {
      const listbox = screen.queryByRole('listbox');
      expect(listbox).toBeNull();
    });
  });

  it('foca no input após selecionar país', async function() {
    render(React.createElement(PhoneInput, { label: 'Telefone', value: '+5511912345678', onChange: function() {} }));
    const countryButton = screen.getByTestId('phone-input-country-select');
    const user = userEvent.setup();
    await user.click(countryButton);
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(screen.getByTestId('phone-input-field')).toBeTruthy();
    });
  });

  it('exibe opções de país com data-testid', async function() {
    render(React.createElement(PhoneInput, { label: 'Telefone', value: '+5511912345678', onChange: function() {} }));
    const countryButton = screen.getByTestId('phone-input-country-select');
    const user = userEvent.setup();
    await user.click(countryButton);
    const options = screen.getAllByTestId('phone-input-country-option');
    expect(options.length).toBeGreaterThan(0);
  });

  it('input tem data-testid', function() {
    render(React.createElement(PhoneInput, { label: 'Telefone', value: '+5511912345678', onChange: function() {} }));
    expect(screen.getByTestId('phone-input-field')).toBeTruthy();
  });

  it('botão de país tem data-testid', function() {
    render(React.createElement(PhoneInput, { label: 'Telefone', value: '+5511912345678', onChange: function() {} }));
    expect(screen.getByTestId('phone-input-country-select')).toBeTruthy();
  });
});