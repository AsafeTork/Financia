import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

export default function CommandPalette({ 
  isOpen, 
  onClose, 
  actions = [],
  placeholder = "Buscar comando... (⌘K)",
  onSearch
}) {
  var [query, setQuery] = useState('');
  var [selectedIndex, setSelectedIndex] = useState(0);
  var inputRef = useRef(null);
  var listRef = useRef(null);

  var filteredActions = useMemo(() => {
    if (!query) return actions;
    var q = query.toLowerCase();
    return actions.filter(a => 
      a.label.toLowerCase().includes(q) || 
      (a.description && a.description.toLowerCase().includes(q)) ||
      (a.keywords && a.keywords.some(k => k.toLowerCase().includes(q)))
    );
  }, [actions, query]);

  useEffect(() => {
    if (isOpen) {
      var handler = (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          onClose();
        }
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handler);
      return () => document.removeEventListener('keydown', handler);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      var item = listRef.current.children[selectedIndex];
      if (item) item.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, filteredActions]);

  var handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filteredActions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filteredActions[selectedIndex]) {
      e.preventDefault();
      filteredActions[selectedIndex].onAction();
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="relative p-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full pl-10 pr-4 py-3 text-base border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ background: 'var(--bg-input)', color: 'var(--text-main)', borderColor: 'var(--border)' }}
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded text-gray-500 font-mono">⌘K</kbd>
          </div>
        </div>
        <div className="max-h-96 overflow-auto" ref={listRef}>
          {filteredActions.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              Nenhum comando encontrado
            </div>
          ) : (
            <ul role="listbox" aria-label="Comandos disponíveis">
              {filteredActions.map((action, i) => (
                <li
                  key={action.id || i}
                  role="option"
                  aria-selected={i === selectedIndex}
                  onClick={() => { action.onAction(); onClose(); }}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    i === selectedIndex 
                      ? 'bg-blue-50 dark:bg-blue-900/30' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  style={{ 
                    background: i === selectedIndex ? 'color-mix(in srgb, var(--brand) 8%, transparent)' : undefined 
                  }}
                >
                  {action.icon && (
                    <span className="w-5 h-5 text-gray-400 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                      {action.icon}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-main)' }}>{action.label}</p>
                    {action.description && (
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{action.description}</p>
                    )}
                  </div>
                  {action.shortcut && (
                    <kbd className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded text-gray-500 font-mono">
                      {action.shortcut}
                    </kbd>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}