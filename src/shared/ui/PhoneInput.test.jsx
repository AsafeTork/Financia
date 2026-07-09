import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import PhoneInput from './PhoneInput.jsx';

describe('PhoneInput', function() {
  it('renderiza com label', function() {
    render(React.createElement(PhoneInput, { label: 'Telefone', onChange: function() {} }));
    expect(screen.getByText('Telefone')).toBeInTheDocument();
  });

  it('exibe o valor do telefone formatado', function() {
    render(React.createElement(PhoneInput, { label: 'Telefone', value: '+5511912345678', onChange: function() {} }));
    var input = screen.getByLabelText('Telefone');
    expect(input.value).toBe('(11) 91234-5678');
  });

  it('chama onChange ao digitar', function() {
    var calls = [];
    render(React.createElement(PhoneInput, { label: 'Telefone', value: '', onChange: function(v) { calls.push(v); } }));
    var input = screen.getByLabelText('Telefone');
    fireEvent.change(input, { target: { value: '11912345678' } });
    expect(calls.length).toBe(2);
    expect(calls[1].national).toBe('11912345678');
    expect(calls[1].country).toBe('BR');
    expect(calls[1].e164).toBe('+5511912345678');
  });

  it('lida com valor vazio sem erro', function() {
    render(React.createElement(PhoneInput, { label: 'Telefone', value: '', onChange: function() {} }));
    var input = screen.getByLabelText('Telefone');
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('');
  });

  it('lida com valor null sem erro', function() {
    render(React.createElement(PhoneInput, { label: 'Telefone', value: null, onChange: function() {} }));
    var input = screen.getByLabelText('Telefone');
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('');
  });
});
