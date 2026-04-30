// Cloudflare Pages Function: POST /api/quote
// Receives quote form submissions and emails them to the business via Resend.
//
// REQUIRED environment variables (set in Cloudflare Pages > Settings > Environment variables):
//   RESEND_API_KEY  — your Resend API key (https://resend.com — free 3000/mo, 100/day)
//   TO_EMAIL        — destination address (e.g. ambitioncommercialservices@gmail.com)
//   FROM_EMAIL      — verified sender (during testing: onboarding@resend.dev;
//                     after domain verification: e.g. quotes@ambitioncommercialservices.com.au)

export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();

    // Basic validation
    const required = ['name', 'phone', 'email', 'service', 'suburb', 'details'];
    for (const field of required) {
      if (!data[field] || typeof data[field] !== 'string' || data[field].trim() === '') {
        return new Response(`Missing field: ${field}`, { status: 400 });
      }
    }

    // Length limits — guard against abuse
    if (data.details.length > 5000 || data.name.length > 200) {
      return new Response('Field too long', { status: 400 });
    }

    // Simple email shape check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return new Response('Invalid email', { status: 400 });
    }

    // Sanitise for HTML email body
    const esc = (s) => String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const subject = `New quote request — ${esc(data.service)} (${esc(data.suburb)})`;

    const html = `
      <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif; max-width:600px; margin:0 auto; padding:24px; color:#1a1a1a;">
        <h2 style="color:#0f2419; border-bottom:2px solid #c9a961; padding-bottom:12px;">New quote request</h2>
        <table style="width:100%; border-collapse:collapse; margin-top:16px;">
          <tr><td style="padding:10px 0; border-bottom:1px solid #eee; width:120px; color:#666;"><strong>Name</strong></td><td style="padding:10px 0; border-bottom:1px solid #eee;">${esc(data.name)}</td></tr>
          <tr><td style="padding:10px 0; border-bottom:1px solid #eee; color:#666;"><strong>Phone</strong></td><td style="padding:10px 0; border-bottom:1px solid #eee;"><a href="tel:${esc(data.phone)}">${esc(data.phone)}</a></td></tr>
          <tr><td style="padding:10px 0; border-bottom:1px solid #eee; color:#666;"><strong>Email</strong></td><td style="padding:10px 0; border-bottom:1px solid #eee;"><a href="mailto:${esc(data.email)}">${esc(data.email)}</a></td></tr>
          <tr><td style="padding:10px 0; border-bottom:1px solid #eee; color:#666;"><strong>Service</strong></td><td style="padding:10px 0; border-bottom:1px solid #eee;">${esc(data.service)}</td></tr>
          <tr><td style="padding:10px 0; border-bottom:1px solid #eee; color:#666;"><strong>Suburb</strong></td><td style="padding:10px 0; border-bottom:1px solid #eee;">${esc(data.suburb)}</td></tr>
        </table>
        <h3 style="color:#0f2419; margin-top:24px;">Details</h3>
        <p style="white-space:pre-wrap; background:#f5f1e8; padding:16px; border-radius:6px;">${esc(data.details)}</p>
        <p style="color:#999; font-size:12px; margin-top:24px;">Sent from ambitioncommercialservices.com.au</p>
      </div>
    `;

    const text = `New quote request

Name:    ${data.name}
Phone:   ${data.phone}
Email:   ${data.email}
Service: ${data.service}
Suburb:  ${data.suburb}

Details:
${data.details}

— Sent from ambitioncommercialservices.com.au`;

    // Send via Resend API
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL,
        to: env.TO_EMAIL,
        reply_to: data.email,
        subject,
        html,
        text,
      }),
    });

    if (!resp.ok) {
      const errBody = await resp.text();
      console.error('Resend error:', resp.status, errBody);
      return new Response('Email service error', { status: 502 });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Function error:', err);
    return new Response('Server error', { status: 500 });
  }
}

// Reject any non-POST requests
export async function onRequest({ request }) {
  if (request.method === 'POST') {
    return onRequestPost(arguments[0]);
  }
  return new Response('Method not allowed', { status: 405 });
}
