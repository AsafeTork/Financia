// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import Feedback from './Feedback.jsx';

describe('Feedback', function() {
  afterEach(function() { cleanup(); });

  it('renderiza erro com role alert', function() {
    render(React.createElement(Feedback, { type: 'error' }, 'Algo deu errado'));
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Algo deu errado')).toBeTruthy();
  });

  it('renderiza sucesso com role status', function() {
    render(React.createElement(Feedback, { type: 'success' }, 'Salvo com sucesso'));
    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.getByText('Salvo com sucesso')).toBeTruthy();
  });

  it('renderiza info com role status', function() {
    render(React.createElement(Feedback, { type: 'info' }, 'Dica útil'));
    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.getByText('Dica útil')).toBeTruthy();
  });

  it('padrao sem type e tratado como erro', function() {
    render(React.createElement(Feedback, null, 'Mensagem'));
    expect(screen.getByRole('alert')).toBeTruthy();
  });

  it('aceita className extra', function() {
    var { container } = render(React.createElement(Feedback, { type: 'error', className: 'my-extra' }, 'x'));
    expect(container.querySelector('.my-extra')).toBeTruthy();
  });
});
