import { neon } from '@neondatabase/serverless';
import { createHash, randomBytes, randomInt, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  email_verified: boolean;
  phone_verified?: boolean;
};

function sqlClient() {
  const url = process.env.NEON_DATABASE_URL;
  if (!url) throw new Error('Neon database is not configured. Add NEON_DATABASE_URL in the app secrets.');
  return neon(url);
}

function normalizeEmail(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function normalizePhone(value: unknown) {
  const raw = String(value || '').replace(/[^\d+]/g, '');
  return raw.startsWith('+') ? raw : `+${raw}`;
}

function hashSecret(value: string, salt = randomBytes(16).toString('hex')) {
  return `${salt}:${scryptSync(value, salt, 64).toString('hex')}`;
}

function verifySecret(value: string, stored: string) {
  const [salt, hex] = stored.split(':');
  if (!salt || !hex) return false;
  const actual = scryptSync(value, salt, 64);
  const expected = Buffer.from(hex, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function hashToken(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function newOtp() {
  return String(randomInt(100000, 1000000));
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'\"]/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    };
    return entities[character] || character;
  });
}

async function ensureSchema() {
  const sql = sqlClient();
  await sql`CREATE TABLE IF NOT EXISTS public.bhs_users (id uuid PRIMARY KEY, full_name text NOT NULL, email text NOT NULL UNIQUE, phone text NOT NULL, password_hash text NOT NULL, email_verified boolean NOT NULL DEFAULT false, phone_verified boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`;
  await sql`ALTER TABLE public.bhs_users ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false`;
  await sql`CREATE TABLE IF NOT EXISTS public.bhs_sessions (id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES public.bhs_users(id) ON DELETE CASCADE, token_hash text NOT NULL UNIQUE, expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS public.bhs_otps (id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES public.bhs_users(id) ON DELETE CASCADE, purpose text NOT NULL, method text NOT NULL, destination text NOT NULL, otp_hash text, external_pin_id text, expires_at timestamptz NOT NULL, consumed_at timestamptz, attempts integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now())`;
}

async function sendEmailOtp(user: UserRow, otp: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('Email OTP is not configured. Add RESEND_API_KEY in the app secrets.');
  const from = process.env.RESEND_FROM_EMAIL || "BH'S <onboarding@resend.dev>";
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [user.email],
      subject: "Your BH'S verification code",
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto"><h1>BH'S</h1><p>Hi ${escapeHtml(user.full_name)},</p><p>Your verification code is:</p><div style="font-size:32px;font-weight:700;letter-spacing:8px;padding:18px 0">${otp}</div><p>This code expires in 5 minutes and can only be used once.</p></div>`,
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('Resend OTP delivery failed', detail);
    throw new Error('Email OTP could not be sent. Check the email delivery configuration.');
  }
}

async function sendPhoneOtp(user: UserRow) {
  const apiKey = process.env.TERMII_API_KEY;
  if (!apiKey) throw new Error('Phone OTP is not configured. Add TERMII_API_KEY in the app secrets.');
  const to = normalizePhone(user.phone).replace(/^\+/, '');
  const response = await fetch('https://api.ng.termii.com/api/sms/otp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      message_type: 'NUMERIC',
      to,
      from: process.env.TERMII_SENDER_ID || 'BH-S',
      channel: process.env.TERMII_CHANNEL || 'generic',
      pin_attempts: MAX_OTP_ATTEMPTS,
      pin_time_to_live: 5,
      pin_length: 6,
      pin_placeholder: '< 123456 >',
      message_text: 'Your BH’S verification code is < 123456 >. It expires in 5 minutes.',
    }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.pinId) {
    console.error('Termii OTP delivery failed', data);
    throw new Error('Phone OTP could not be sent. Check the phone OTP configuration.');
  }
  return String(data.pinId);
}

async function issueOtp(user: UserRow, method: 'email' | 'phone') {
  const sql = sqlClient();
  const latest = await sql`SELECT created_at FROM public.bhs_otps WHERE user_id=${user.id} AND purpose='signup_verification' ORDER BY created_at DESC LIMIT 1`;
  if (latest[0] && Date.now() - new Date(String(latest[0].created_at)).getTime() < OTP_RESEND_COOLDOWN_MS) {
    throw new Error('Please wait before requesting another code.');
  }

  const expires = new Date(Date.now() + OTP_TTL_MS).toISOString();
  await sql`UPDATE public.bhs_otps SET consumed_at=COALESCE(consumed_at, ${new Date().toISOString()}) WHERE user_id=${user.id} AND purpose='signup_verification' AND consumed_at IS NULL`;

  if (method === 'email') {
    const otp = newOtp();
    const otpHash = hashSecret(otp);
    await sql`INSERT INTO public.bhs_otps (id,user_id,purpose,method,destination,otp_hash,expires_at) VALUES (${randomUUID()},${user.id},'signup_verification','email',${user.email},${otpHash},${expires})`;
    try {
      await sendEmailOtp(user, otp);
    } catch (error) {
      await sql`DELETE FROM public.bhs_otps WHERE user_id=${user.id} AND purpose='signup_verification' AND consumed_at IS NULL`;
      throw error;
    }
    return;
  }

  const externalPinId = await sendPhoneOtp(user);
  await sql`INSERT INTO public.bhs_otps (id,user_id,purpose,method,destination,external_pin_id,expires_at) VALUES (${randomUUID()},${user.id},'signup_verification','phone',${normalizePhone(user.phone)},${externalPinId},${expires})`;
}

export async function signup(body: Record<string, unknown>) {
  await ensureSchema();
  const fullName = String(body.fullName || '').trim();
  const email = normalizeEmail(body.email);
  const phone = normalizePhone(body.phone);
  const password = String(body.password || '');
  const method = String(body.otpMethod || 'email') === 'phone' ? 'phone' : 'email';

  if (fullName.length < 2) throw new Error('Enter your full name');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address');
  if (phone.replace(/\D/g, '').length < 10) throw new Error('Enter a valid phone number');
  if (password.length < 8) throw new Error('Password must be at least 8 characters');

  const sql = sqlClient();
  const existing = await sql`SELECT id,full_name,email,phone,email_verified,phone_verified FROM public.bhs_users WHERE email=${email} LIMIT 1` as UserRow[];
  if (existing[0]) {
    if (existing[0].email_verified || existing[0].phone_verified) throw new Error('An account already exists with this email');
    await issueOtp(existing[0], method);
    return { needsVerification: true, email, method };
  }

  const id = randomUUID();
  const user = { id, full_name: fullName, email, phone, email_verified: false, phone_verified: false } as UserRow;
  await sql`INSERT INTO public.bhs_users (id,full_name,email,phone,password_hash) VALUES (${id},${fullName},${email},${phone},${hashSecret(password)})`;
  try {
    await issueOtp(user, method);
  } catch (error) {
    await sql`DELETE FROM public.bhs_users WHERE id=${id}`;
    throw error;
  }
  return { needsVerification: true, email, method };
}

export async function resendOtp(emailInput: string, methodInput: string) {
  await ensureSchema();
  const email = normalizeEmail(emailInput);
  const method = methodInput === 'phone' ? 'phone' : 'email';
  const sql = sqlClient();
  const rows = await sql`SELECT id,full_name,email,phone,email_verified,phone_verified FROM public.bhs_users WHERE email=${email} LIMIT 1` as UserRow[];
  const user = rows[0];
  if (!user) throw new Error('Account not found');
  if (user.email_verified || user.phone_verified) throw new Error('Account is already verified');
  await issueOtp(user, method);
  return { needsVerification: true, email, method };
}

async function verifyPhonePin(pinId: string, otp: string) {
  const apiKey = process.env.TERMII_API_KEY;
  if (!apiKey) throw new Error('Phone OTP is not configured. Add TERMII_API_KEY in the app secrets.');
  const response = await fetch('https://api.ng.termii.com/api/sms/otp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey, pin_id: pinId, pin: otp }),
  });
  const data = await response.json().catch(() => null);
  return response.ok && String(data?.verified).toLowerCase() === 'true';
}

export async function verifyOtp(emailInput: string, otp: string, methodInput: string) {
  await ensureSchema();
  const email = normalizeEmail(emailInput);
  const method = methodInput === 'phone' ? 'phone' : 'email';
  if (!/^\d{6}$/.test(otp)) throw new Error('Enter the 6-digit code');

  const sql = sqlClient();
  const users = await sql`SELECT id,full_name,email,phone,email_verified,phone_verified FROM public.bhs_users WHERE email=${email} LIMIT 1` as UserRow[];
  const user = users[0];
  if (!user) throw new Error('Account not found');

  const rows = await sql`SELECT id,otp_hash,external_pin_id,expires_at,consumed_at,attempts,method FROM public.bhs_otps WHERE user_id=${user.id} AND purpose='signup_verification' AND method=${method} ORDER BY created_at DESC LIMIT 1`;
  const record = rows[0] as { id: string; otp_hash: string | null; external_pin_id: string | null; expires_at: string; consumed_at: string | null; attempts: number } | undefined;
  if (!record || record.consumed_at) throw new Error('That code is no longer valid. Request a new one.');
  if (new Date(record.expires_at).getTime() <= Date.now()) throw new Error('That code has expired. Request a new one.');
  if (record.attempts >= MAX_OTP_ATTEMPTS) throw new Error('Too many attempts. Request a new code.');

  let valid = false;
  if (method === 'email') valid = !!record.otp_hash && verifySecret(otp, record.otp_hash);
  else if (record.external_pin_id) valid = await verifyPhonePin(record.external_pin_id, otp);
  if (!valid) {
    await sql`UPDATE public.bhs_otps SET attempts=attempts+1 WHERE id=${record.id}`;
    throw new Error('Incorrect verification code');
  }

  await sql`UPDATE public.bhs_otps SET consumed_at=${new Date().toISOString()} WHERE id=${record.id}`;
  if (method === 'email') await sql`UPDATE public.bhs_users SET email_verified=true,updated_at=now() WHERE id=${user.id}`;
  else await sql`UPDATE public.bhs_users SET phone_verified=true,updated_at=now() WHERE id=${user.id}`;
  return createSession(user);
}

export async function login(emailInput: string, password: string) {
  await ensureSchema();
  const email = normalizeEmail(emailInput);
  const sql = sqlClient();
  const rows = await sql`SELECT id,full_name,email,phone,email_verified,phone_verified,password_hash FROM public.bhs_users WHERE email=${email} LIMIT 1`;
  const row = rows[0] as (UserRow & { password_hash: string }) | undefined;
  if (!row || !verifySecret(password, row.password_hash)) throw new Error('Email or password is incorrect');
  if (!row.email_verified && !row.phone_verified) {
    await issueOtp(row, 'email');
    return { needsVerification: true, email, method: 'email' };
  }
  return createSession(row);
}

async function createSession(user: UserRow) {
  const token = `bh_${randomBytes(32).toString('base64url')}`;
  const sql = sqlClient();
  const expires = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  await sql`DELETE FROM public.bhs_sessions WHERE user_id=${user.id} AND expires_at<now()`;
  await sql`INSERT INTO public.bhs_sessions (id,user_id,token_hash,expires_at) VALUES (${randomUUID()},${user.id},${hashToken(token)},${expires})`;
  return { token, user: { id: user.id, fullName: user.full_name, email: user.email, phone: user.phone } };
}

export async function me(token: string) {
  await ensureSchema();
  const sql = sqlClient();
  const rows = await sql`SELECT u.id,u.full_name,u.email,u.phone,u.email_verified,u.phone_verified FROM public.bhs_sessions s JOIN public.bhs_users u ON u.id=s.user_id WHERE s.token_hash=${hashToken(token)} AND s.expires_at>now() LIMIT 1` as UserRow[];
  const user = rows[0];
  if (!user) throw new Error('Session expired');
  return { user: { id: user.id, fullName: user.full_name, email: user.email, phone: user.phone } };
}

export async function logout(token: string) {
  await ensureSchema();
  const sql = sqlClient();
  await sql`DELETE FROM public.bhs_sessions WHERE token_hash=${hashToken(token)}`;
  return { ok: true };
}
