import { neon } from '@neondatabase/serverless';
import { signup, verifyOtp, login, resendOtp, me, logout } from '../backend/auth';

function json(res: any, body: unknown, status = 200) {
  res.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
}

async function readBody(req: any): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === 'object') return req.body as Record<string, unknown>;
  if (typeof req.body === 'string' && req.body) {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk: Buffer) => { raw += chunk.toString(); });
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { resolve({}); } });
  });
}

function sessionFrom(body: Record<string, unknown>) {
  return String(body.sessionToken || '');
}

async function sessionUser(token: string) {
  if (!token) throw new Error('Authentication required');
  return me(token);
}

function authError(res: any, error: unknown, fallback: string, status = 400) {
  const message = error instanceof Error ? error.message : fallback;
  const config = /not configured|could not be sent/i.test(message);
  json(res, { error: message }, config ? 503 : status);
}

export default async function handler(req: any, res: any) {
  const url = new URL(req.url || '/', 'http://localhost');
  const path = url.pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');
  const body = await readBody(req);

  try {
    if (req.method === 'GET' && path === 'health') return json(res, { ok: true, app: "BH'S", mode: 'sandbox' });

    if (req.method === 'POST' && path === 'auth/signup') {
      try { return json(res, await signup(body), 201); } catch (e) { return authError(res, e, 'Unable to create account'); }
    }

    if (req.method === 'POST' && path === 'auth/verify-otp') {
      try { return json(res, await verifyOtp(String(body.email || ''), String(body.otp || ''), String(body.method || 'email'))); } catch (e) { return authError(res, e, 'Unable to verify code'); }
    }

    if (req.method === 'POST' && path === 'auth/login') {
      try { return json(res, await login(String(body.email || ''), String(body.password || ''))); } catch (e) { return authError(res, e, 'Unable to sign in', 401); }
    }

    if (req.method === 'POST' && path === 'auth/resend') {
      try { return json(res, await resendOtp(String(body.email || ''), String(body.method || 'email'))); } catch (e) { return authError(res, e, 'Unable to resend code'); }
    }

    if (req.method === 'POST' && path === 'auth/me') {
      try { return json(res, await sessionUser(sessionFrom(body))); } catch (e) { return json(res, { error: e instanceof Error ? e.message : 'Session expired' }, 401); }
    }

    if (req.method === 'POST' && path === 'auth/logout') {
      try { return json(res, await logout(sessionFrom(body))); } catch (e) { return json(res, { error: e instanceof Error ? e.message : 'Unable to sign out' }, 400); }
    }

    if (req.method === 'POST' && path === 'transfers') {
      try {
        const auth = await sessionUser(String(body.sessionToken || ''));
        const recipient = String(body.recipient || '').trim();
        const amount = Number(body.amount);
        if (!recipient || !Number.isFinite(amount) || amount <= 0) return json(res, { error: 'Recipient and positive amount are required' }, 400);
        const databaseUrl = process.env.NEON_DATABASE_URL;
        if (!databaseUrl) return json(res, { error: 'Neon database is not configured' }, 503);
        const sql = neon(databaseUrl);
        const id = crypto.randomUUID();
        const createdAt = new Date().toISOString();
        const currency = String(body.currency || 'NGN');
        await sql`CREATE TABLE IF NOT EXISTS public.bhs_transactions (id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES public.bhs_users(id) ON DELETE CASCADE, recipient text NOT NULL, amount numeric NOT NULL, currency text NOT NULL, created_at timestamptz NOT NULL, status text NOT NULL)`;
        await sql`INSERT INTO public.bhs_transactions (id,user_id,recipient,amount,currency,created_at,status) VALUES (${id},${auth.user.id},${recipient},${amount},${currency},${createdAt},'completed')`;
        return json(res, { id, userId: auth.user.id, recipient, amount, currency, createdAt, status: 'completed' }, 201);
      } catch (e) {
        return json(res, { error: e instanceof Error ? e.message : 'Unable to create transfer' }, 400);
      }
    }

    return json(res, { error: 'Not found' }, 404);
  } catch (e) {
    return json(res, { error: e instanceof Error ? e.message : 'Internal server error' }, 500);
  }
}
