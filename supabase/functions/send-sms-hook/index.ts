// Supabase Auth "Send SMS Hook" — forwards OTP to MSG91.
// Configure in Dashboard → Authentication → Hooks → Send SMS hook (HTTPS).
// Required secrets: MSG91_AUTHKEY, MSG91_TEMPLATE_ID, MSG91_SENDER, SEND_SMS_HOOK_SECRET
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';

const MSG91_AUTHKEY = Deno.env.get('MSG91_AUTHKEY') ?? '';
const MSG91_TEMPLATE_ID = Deno.env.get('MSG91_TEMPLATE_ID') ?? '';
const MSG91_SENDER = Deno.env.get('MSG91_SENDER') ?? '';
const HOOK_SECRET = (Deno.env.get('SEND_SMS_HOOK_SECRET') ?? '').replace('v1,whsec_', '');

serve(async (req) => {
  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    const wh = new Webhook(HOOK_SECRET);
    const { user, sms } = wh.verify(payload, headers) as {
      user: { phone: string };
      sms: { otp: string };
    };

    const phone = user.phone.replace(/^\+/, ''); // MSG91 wants country code without '+'
    const url = `https://control.msg91.com/api/v5/flow/`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { authkey: MSG91_AUTHKEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: MSG91_TEMPLATE_ID,
        sender: MSG91_SENDER,
        short_url: '0',
        recipients: [{ mobiles: phone, otp: sms.otp }],
      }),
    });
    const data = await resp.json();
    if (!resp.ok || data.type === 'error') {
      return new Response(JSON.stringify({ error: data }), { status: 500 });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 401 });
  }
});
