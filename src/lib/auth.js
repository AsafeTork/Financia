import { sb } from './supabase.js';

export const signIn = async function(email, pass) {
  return sb.auth.signInWithPassword({email: email, password: pass});
};

export const signUp = async function(email, pass, meta) {
  return sb.auth.signUp({
    email: email,
    password: pass,
    options: { data: meta || {}, emailRedirectTo: window.location.origin },
  });
};

export const signInWithGoogle = async function() {
  return sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
};

export const sendPasswordReset = async function(email) {
  return sb.auth.resetPasswordForEmail(email, {redirectTo: window.location.origin});
};

export const updatePassword = async function(newPw) {
  return sb.auth.updateUser({password: newPw});
};

export const uploadLogo = async function(path, file) {
  const upRes = await sb.storage.from('logos').upload(path, file, {upsert: true});
  if (upRes.error) return {error: upRes.error, url: null};
  const urlRes = sb.storage.from('logos').getPublicUrl(path);
  return {error: null, url: urlRes.data.publicUrl};
};

export const signOut = function() {
  return sb.auth.signOut().catch(function(err) { console.warn('signOut error', err); });
};

// --- WebAuthn / Passkey (WCAG 3.3.8: passwordless com fallback para senha) ---
// Usa o motor nativo do Supabase Auth (ver DECISIONS.md D017): registerPasskey e
// signInWithPasskey rodam a cerimônia WebAuthn completa (challenge + credentials + verify).

var PASSKEY_ERROR_LABELS = {
  passkey_disabled: 'Login por passkey não está habilitado para esta conta.',
  too_many_passkeys: 'Número máximo de passkeys atingido. Remova uma para adicionar outra.',
  webauthn_credential_exists: 'Esta credencial já foi cadastrada nesta conta.',
  webauthn_credential_not_found: 'Credencial não reconhecida. Tente novamente ou use a senha.',
  webauthn_challenge_not_found: 'Sessão expirada. Atualize a página e tente novamente.',
  webauthn_challenge_expired: 'Tempo esgotado. Atualize a página e tente novamente.',
  webauthn_verification_failed: 'Falha na verificação da credencial. Tente novamente.',
  email_not_confirmed: 'Confirme seu e-mail antes de usar passkeys.',
  phone_not_confirmed: 'Confirme seu telefone antes de usar passkeys.',
  user_banned: 'Usuário bloqueado.',
};

var PASSKEY_BROWSER_ERRORS = {
  'NotSupportedError': 'WebAuthn não é suportado por este navegador ou dispositivo.',
  'NotAllowedError': 'Operação cancelada. Verifique se permitiu o uso da credencial (biometria, PIN ou chave física).',
  'SecurityError': 'Erro de segurança durante a cerimônia WebAuthn.',
  'AbortError': 'Operação cancelada.',
  'UnknownError': 'Não foi possível concluir a cerimônia WebAuthn. Tente novamente.',
  'InvalidStateError': 'Credencial já registrada nesse dispositivo.',
};

function passkeyErrorMessage(err) {
  if (!err) return 'Erro desconhecido ao usar a passkey.';
  var code = err.code || err.name || '';
  var friendly = PASSKEY_ERROR_LABELS[code] || PASSKEY_BROWSER_ERRORS[code] || err.message || '';
  if (friendly) return friendly;
  return 'Não foi possível concluir a autenticação por passkey. Tente novamente ou use a senha.';
}

// Detecta suporte do navegador a WebAuthn. PublicKeyCredential é o entry point da
// API WebAuthn; sua ausência implica fallback para senha (WCAG 3.3.8).
export const isWebAuthnSupported = function() {
  return typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential === 'function';
};

// Registra uma passkey para o usuário autenticado (precisa de sessão ativa).
export const registerPasskey = async function() {
  try {
    var res = await sb.auth.registerPasskey();
    if (res.error) return { data: null, error: res.error, message: passkeyErrorMessage(res.error) };
    return { data: res.data, error: null, message: null };
  } catch (err) {
    return { data: null, error: err, message: passkeyErrorMessage(err) };
  }
};

// Autentica de forma passwordless usando uma credencial passkey (descobrível).
export const signInWithPasskey = async function() {
  try {
    var res = await sb.auth.signInWithPasskey();
    if (res.error) return { data: null, error: res.error, message: passkeyErrorMessage(res.error) };
    return { data: res.data, error: null, message: null };
  } catch (err) {
    return { data: null, error: err, message: passkeyErrorMessage(err) };
  }
};

// Lista as passkeys registradas pelo usuário autenticado.
export const listPasskeys = async function() {
  try {
    var res = await sb.auth.passkey.list();
    if (res.error) return { data: null, error: res.error, message: passkeyErrorMessage(res.error) };
    return { data: res.data, error: null, message: null };
  } catch (err) {
    return { data: null, error: err, message: passkeyErrorMessage(err) };
  }
};

// Remove uma passkey pelo id da credencial.
export const deletePasskey = async function(credentialId) {
  if (!credentialId) return { data: null, error: new Error('credentialId ausente'), message: 'Credencial inválida.' };
  try {
    var res = await sb.auth.passkey.delete({ credentialId: credentialId });
    if (res.error) return { data: null, error: res.error, message: passkeyErrorMessage(res.error) };
    return { data: res.data, error: null, message: null };
  } catch (err) {
    return { data: null, error: err, message: passkeyErrorMessage(err) };
  }
};
