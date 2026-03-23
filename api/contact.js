const nodemailer = require('nodemailer');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CONFIG
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const CONFIG = {
  gmail: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
  receiverEmail: process.env.GMAIL_USER,
  telegram: {
    token:  process.env.TELEGRAM_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function buildEmailHTML(data) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f5f3ee;padding:32px;">
    <div style="background:#FF4D00;padding:24px 32px;margin-bottom:0;">
      <h1 style="color:#fff;font-size:24px;margin:0;">Shosh Digital</h1>
      <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px;">Yangi loyiha so'rovi keldi</p>
    </div>
    <div style="background:#fff;padding:32px;border:1px solid #e2ddd5;border-top:none;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:12px 0;border-bottom:1px solid #eee;color:#5a5248;font-size:13px;width:140px;">👤 Ism</td>
            <td style="padding:12px 0;border-bottom:1px solid #eee;font-weight:bold;color:#1a1714;">${data.name}</td></tr>
        <tr><td style="padding:12px 0;border-bottom:1px solid #eee;color:#5a5248;font-size:13px;">🏢 Kompaniya</td>
            <td style="padding:12px 0;border-bottom:1px solid #eee;color:#1a1714;">${data.company || '—'}</td></tr>
        <tr><td style="padding:12px 0;border-bottom:1px solid #eee;color:#5a5248;font-size:13px;">📬 Aloqa</td>
            <td style="padding:12px 0;border-bottom:1px solid #eee;color:#1a1714;">${data.contact}</td></tr>
        <tr><td style="padding:12px 0;border-bottom:1px solid #eee;color:#5a5248;font-size:13px;">📞 Telefon</td>
            <td style="padding:12px 0;border-bottom:1px solid #eee;color:#1a1714;">${data.phone || '—'}</td></tr>
        <tr><td style="padding:12px 0;border-bottom:1px solid #eee;color:#5a5248;font-size:13px;">🛠 Xizmat</td>
            <td style="padding:12px 0;border-bottom:1px solid #eee;color:#FF4D00;font-weight:bold;">${data.service}</td></tr>
      </table>
      <div style="margin-top:24px;">
        <p style="color:#5a5248;font-size:13px;margin-bottom:8px;">📝 Loyiha haqida:</p>
        <div style="background:#f5f3ee;padding:16px;border-left:4px solid #FF4D00;color:#1a1714;line-height:1.7;font-size:15px;">
          ${data.message || '—'}
        </div>
      </div>
    </div>
    <div style="background:#0a0a0a;padding:16px 32px;text-align:center;">
      <p style="color:rgba(255,255,255,0.35);font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0;">
        © 2026 Shosh Digital Agency · Tashkent, UZ
      </p>
    </div>
  </div>`;
}

async function sendTelegram(data) {
  const text =
    `🚀 *Yangi loyiha so'rovi!*\n\n` +
    `👤 *Ism:* ${data.name}\n` +
    `🏢 *Kompaniya:* ${data.company || '—'}\n` +
    `📬 *Aloqa:* ${data.contact}\n` +
    `📞 *Telefon:* ${data.phone || '—'}\n` +
    `🛠 *Xizmat:* ${data.service}\n\n` +
    `📝 *Loyiha haqida:*\n${data.message || '—'}`;

  const url = `https://api.telegram.org/bot${CONFIG.telegram.token}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CONFIG.telegram.chatId,
      text,
      parse_mode: 'Markdown',
    }),
  });
  return res.ok;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  VERCEL HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
module.exports = async (req, res) => {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const { name, company, contact, phone, service, message } = req.body;

  if (!name || !contact) {
    return res.status(400).json({ ok: false, error: 'Name and contact are required.' });
  }

  const data = { name, company, contact, phone, service, message };
  const results = { email: false, telegram: false };

  // Send Email
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: CONFIG.gmail.user, pass: CONFIG.gmail.pass },
    });
    await transporter.sendMail({
      from: `"Shosh Digital Form" <${CONFIG.gmail.user}>`,
      to: CONFIG.receiverEmail,
      subject: `🚀 Yangi so'rov: ${name} — ${service || 'Shosh Digital'}`,
      html: buildEmailHTML(data),
    });
    results.email = true;
  } catch (err) {
    console.error('Email error:', err.message);
  }

  // Send Telegram
  try {
    results.telegram = await sendTelegram(data);
  } catch (err) {
    console.error('Telegram error:', err.message);
  }

  if (results.email || results.telegram) {
    return res.json({ ok: true, results });
  } else {
    return res.status(500).json({ ok: false, error: 'Both email and Telegram failed.' });
  }
};
