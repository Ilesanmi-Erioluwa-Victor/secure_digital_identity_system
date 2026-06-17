const nodemailer = require('nodemailer');

let transporter = null;

if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS !== 'your_gmail_app_password') {
  const emailPort = parseInt(process.env.EMAIL_PORT, 10) || 465;
  console.log(`[EMAIL] Creating transporter: host=${process.env.EMAIL_HOST}, port=${emailPort}, secure=${emailPort === 465}`);
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: emailPort,
    secure: emailPort === 465,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  transporter.verify().then(() => console.log('[EMAIL] Transporter verified OK')).catch((e) => console.error('[EMAIL] Transporter verify FAILED:', e.message));
} else {
  console.log('[EMAIL] Transporter NOT created — missing env vars or placeholder password');
}

const sendEmail = async ({ to, subject, html }) => {
  if (!transporter) {
    console.log(`\n========== DEV EMAIL (not sent) ==========`);
    console.log(`  To:       ${to}`);
    console.log(`  Subject:  ${subject}`);
    console.log(`  Body:     ${html.replace(/<[^>]*>/g, '')}`);
    console.log(`===========================================\n`);
    return { messageId: 'dev-mode' };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Email sending failed: ${error.message}`);
    throw error;
  }
};

module.exports = { transporter, sendEmail };
