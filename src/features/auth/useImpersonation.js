import { useEffect, useCallback } from 'react';
import { sb } from '../../lib/supabase.js';

// In-memory storage for impersonation token (not persisted to localStorage)
let impersonationTokenRef = null;

export function useImpersonation({ toast }) {
  const handleImpersonation = useCallback(async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl) return;

      // Request impersonation token from backend (which sets HttpOnly cookie)
      const response = await fetch(`${apiUrl}/api/impersonation-token`, {
        method: 'POST',
        credentials: 'include', // Include HttpOnly cookie
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) return;
      
      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch (_) { return; }
      const { impersonation_token } = data;
      if (!impersonation_token) return;
      
      // Store in memory only (not localStorage)
      impersonationTokenRef = impersonation_token;
      
      // Set session with impersonation token
      const { error } = await sb.auth.setSession({
        access_token: impersonation_token,
        refresh_token: '', // No refresh token for impersonation
      });
      
      if (error) throw error;
      
      // Clear URL hash if any
      window.location.hash = '';
      window.location.reload();
    } catch (err) {
      if (toast) toast('Erro ao acessar conta: ' + (err.message || 'tente novamente'), 'error');
      window.location.hash = '';
    }
  }, [toast]);

  // Check for impersonation token in memory on mount
  useEffect(() => {
    if (impersonationTokenRef) {
      sb.auth.setSession({
        access_token: impersonationTokenRef,
        refresh_token: '',
      }).then(() => {
        window.location.reload();
      });
    }
  }, []);

  useEffect(() => {
    handleImpersonation();
  }, [handleImpersonation]);
}

// Export getter for other modules to use
export function getImpersonationToken() {
  return impersonationTokenRef;
}

export function clearImpersonationToken() {
  impersonationTokenRef = null;
}