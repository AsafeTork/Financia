// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ColorField from './ColorField.jsx';

describe('ColorField', function() {
  it('renderiza label e descricao', function() {
    render(React.createElement(ColorField, { label: 'Primaria', desc: 'Cor principal', value: '#002f59', onChange: function() {} }));
    expect(screen.getByText('Primaria')).toBeInTheDocument();
    expect(screen.getByText('Cor principal')).toBeInTheDocument();
  });

  it('renderiza sem descricao', function() {
    render(React.createElement(ColorField, { label: 'Primaria', value: '#002f59', onChange: function() {} }));
    expect(screen.getByText('Primaria')).toBeInTheDocument();
  });

  it('atualiza cor via input de texto', function() {
    var calls = [];
    render(React.createElement(ColorField, { label: 'Primaria', value: '#002f59', onChange: function(v) { calls.push(v); } }));
    var textInput = screen.getByPlaceholderText('#000000');
    fireEvent.change(textInput, { target: { value: '#ff0000' } });
    expect(calls[0]).toBe('#ff0000');
  });

  it('atualiza cor via color picker', function() {
    var calls = [];
    render(React.createElement(ColorField, { label: 'Primaria', value: '#002f59', onChange: function(v) { calls.push(v); } }));
    var colorInput = document.querySelector('input[type="color"]');
    fireEvent.change(colorInput, { target: { value: '#ff0000' } });
    expect(calls.length).toBe(1);
  });

  it('input de texto exibe o valor atual', function() {
    render(React.createElement(ColorField, { label: 'Primaria', value: '#002f59', onChange: function() {} }));
    var textInput = screen.getByPlaceholderText('#000000');
    expect(textInput.value).toBe('#002f59');
  });

  it('swatch exibe a cor atual', function() {
    var container = render(React.createElement(ColorField, { label: 'Primaria', value: '#002f59', onChange: function() {} }));
    var swatch = container.container.querySelector('div[class*="w-8"]');
    expect(swatch.style.background).toBe('rgb(0, 47, 89)');
  });

  it('renderiza com valor vazio', function() {
    render(React.createElement(ColorField, { label: 'Primaria', value: '', onChange: function() {} }));
    var textInput = screen.getByPlaceholderText('#000000');
    expect(textInput.value).toBe('');
  });
});
