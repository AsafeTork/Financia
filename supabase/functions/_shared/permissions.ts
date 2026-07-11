// Permissions and authorization helpers for Edge Functions

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface AuthContext {
  userId: string;
  email: string;
  isAdmin: boolean;
  role?: string;
}

export async function getAuthContext(
  req: Request,
  supabaseUrl: string,
  anonKey: string
): Promise<AuthContext | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  return {
    userId: user.id,
    email: user.email || '',
    isAdmin: false,
  };
}

export async function requireAdmin(
  req: Request,
  supabaseUrl: string,
  anonKey: string,
  serviceKey: string
): Promise<AuthContext> {
  const auth = await getAuthContext(req, supabaseUrl, anonKey);
  if (!auth) throw new Error('unauthorized');

  const admin = createClient(supabaseUrl, serviceKey);
  const { data, error } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', auth.userId)
    .eq('role', 'admin')
    .maybeSingle();

  if (error || !data) {
    throw new Error('forbidden');
  }

  return { ...auth, isAdmin: true, role: 'admin' };
}

export async function requireAuth(
  req: Request,
  supabaseUrl: string,
  anonKey: string
): Promise<AuthContext> {
  const auth = await getAuthContext(req, supabaseUrl, anonKey);
  if (!auth) throw new Error('unauthorized');
  return auth;
}

export interface Permission {
  resource: string;
  action: string;
  condition?: (ctx: AuthContext, resource: any) => boolean;
}

export const PERMISSIONS = {
  // Client management
  client: {
    read: { resource: 'client', action: 'read' },
    write: { resource: 'client', action: 'write' },
    delete: { resource: 'client', action: 'delete' },
    impersonate: { resource: 'client', action: 'impersonate' },
    buildApk: { resource: 'client', action: 'build_apk' },
  },
  
  // Subscription management
  subscription: {
    read: { resource: 'subscription', action: 'read' },
    create: { resource: 'subscription', action: 'create' },
    update: { resource: 'subscription', action: 'update' },
    cancel: { resource: 'subscription', action: 'cancel' },
  },
  
  // Financial
  payment: {
    read: { resource: 'payment', action: 'read' },
    create: { resource: 'payment', action: 'create' },
    refund: { resource: 'payment', action: 'refund' },
  },
  
  // Admin operations
  admin: {
    users: { resource: 'admin', action: 'users' },
    settings: { resource: 'admin', action: 'settings' },
    analytics: { resource: 'admin', action: 'analytics' },
    jobs: { resource: 'admin', action: 'jobs' },
    migrate: { resource: 'admin', action: 'migrate' },
  },
  
  // AI features
  ai: {
    prompt: { resource: 'ai', action: 'prompt' },
    palette: { resource: 'ai', action: 'palette' },
    email: { resource: 'ai', action: 'email' },
    insights: { resource: 'ai', action: 'insights' },
  },
} as const;

export function hasPermission(ctx: AuthContext, permission: Permission): boolean {
  if (ctx.isAdmin) return true;
  
  // TODO: Implement role-based permission checking
  // For now, only admins have full access
  return false;
}

export function requirePermission(ctx: AuthContext, permission: Permission): void {
  if (!hasPermission(ctx, permission)) {
    throw new Error(`forbidden: missing permission ${permission.resource}:${permission.action}`);
  }
}