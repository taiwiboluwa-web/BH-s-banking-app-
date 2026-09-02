import { router, json, error, db } from '@appdeploy/sdk';
import { requireAuth } from '@appdeploy/sdk';

type Transfer = { userId: string; recipient: string; amount: number; currency: string; createdAt: string; status: string };

export const handler = router({
  'GET /api/health': [async () => json({ ok: true, app: "BH'S", mode: 'sandbox' })],
  'GET /api/transactions': [requireAuth(), async (ctx) => {
    const result = await db.list<Transfer>(`transactions:${ctx.user!.userId}`, { limit: 50 });
    return json(result.items);
  }],
  'POST /api/transfers': [requireAuth(), async (ctx) => {
    const body = ctx.body as Partial<Transfer>;
    if (!body.recipient || !body.amount || Number(body.amount) <= 0) return error('Recipient and positive amount are required', 400);
    const record: Transfer = { userId: ctx.user!.userId, recipient: String(body.recipient), amount: Number(body.amount), currency: String(body.currency || 'NGN'), createdAt: new Date().toISOString(), status: 'completed' };
    const [id] = await db.add(`transactions:${ctx.user!.userId}`, [record]);
    if (!id) return error('Unable to create transfer', 500);
    return json({ id, ...record }, 201);
  }],
});
