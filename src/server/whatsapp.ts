const enabled = () => (process.env.WHATSAPP_API_ENABLED ?? 'true') !== 'false';

async function post(url: string, body: unknown, headers: Record<string, string> = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    console.warn(`WhatsApp API returned error (status ${res.status}): ${await res.text().catch(() => '')}`);
  }
}

/** Fire the message through the configured gateway. Never throws. */
export async function sendAutoWhatsAppMessage(phoneNumber: string, text: string): Promise<void> {
  if (!phoneNumber || !phoneNumber.trim()) return;
  let phone = phoneNumber.replace(/[^0-9]/g, '');
  if (phone.length === 10) phone = '91' + phone;

  const token = process.env.WHATSAPP_API_TOKEN;
  if (!enabled() || !token || !token.trim()) {
    console.info(`[WHATSAPP AUTO-DISPATCH (SIMULATION)] To: +${phone}, Message: ${text.replace(/\n/g, ' ')}`);
    return;
  }
  const provider = (process.env.WHATSAPP_API_PROVIDER || 'generic').toLowerCase();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const instanceId = process.env.WHATSAPP_INSTANCE_ID;
  const apiUrl = process.env.WHATSAPP_API_URL;

  try {
    if (provider === 'meta' || phoneNumberId?.trim()) {
      await post(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phone,
          type: 'text',
          text: { preview_url: 'false', body: text },
        },
        { Authorization: `Bearer ${token}` },
      );
    } else if (provider === 'ultramsg' || instanceId?.trim()) {
      await post(`https://api.ultramsg.com/${instanceId || 'instance'}/messages/chat`, {
        token,
        to: '+' + phone,
        body: text,
      });
    } else if (apiUrl?.trim()) {
      await post(apiUrl, { to: phone, phone, message: text }, { Authorization: `Bearer ${token}` });
    } else {
      console.warn(`WhatsApp generic API URL is missing. Message to +${phone} not sent.`);
    }
  } catch (e) {
    console.warn(`Failed to auto-dispatch WhatsApp message to +${phone}:`, e instanceof Error ? e.message : e);
  }
}
