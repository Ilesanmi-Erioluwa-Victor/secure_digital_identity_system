const nodemailer = require('nodemailer');

let transporter = null;
let usingEthereal = false;

const initTransporter = async () => {
  const hasSmtpConfig = process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS !== 'your_gmail_app_password';

  if (hasSmtpConfig) {
    const emailPort = parseInt(process.env.EMAIL_PORT, 10) || 587;
    console.log(`[EMAIL] Creating SMTP transporter: host=${process.env.EMAIL_HOST}, port=${emailPort}, secure=${emailPort === 465}`);
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
    try {
      await transporter.verify();
      console.log('[EMAIL] SMTP transporter verified OK');
      return;
    } catch (err) {
      console.error('[EMAIL] SMTP transporter verify FAILED:', err.message);
      console.log('[EMAIL] Falling back to Ethereal test email...');
      transporter = null;
    }
  }

  // Fallback: Ethereal Email (fake SMTP, emails viewable at ethereal.email)
  console.log('[EMAIL] Creating Ethereal test account...');
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    usingEthereal = true;
    console.log(`[EMAIL] Ethereal account created: ${testAccount.user}`);
    console.log(`[EMAIL] View emails at: https://ethereal.email/login`);
  } catch (err) {
    console.error('[EMAIL] Failed to create Ethereal account:', err.message);
  }
};

const sendEmail = async ({ to, subject, html }) => {
  if (!transporter) {
    console.log(`\n========== EMAIL NOT SENT (no transporter) ==========`);
    console.log(`  To:       ${to}`);
    console.log(`  Subject:  ${subject}`);
    console.log(`  Body:     ${html.replace(/<[^>]*>/g, '')}`);
    console.log(`====================================================\n`);
    return { messageId: 'no-transporter' };
  }

  try {
    const info = await transporter.sendMail({
      from: usingEthereal ? '"DSPoly Library" <dspoly@ethereal.email>' : (process.env.EMAIL_FROM || '"DSPoly Library" <noreply@dspoly.edu.ng>'),
      to,
      subject,
      html,
    });
    console.log(`[EMAIL] Sent: ${info.messageId}`);
    if (usingEthereal) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`[EMAIL] Preview URL: ${previewUrl}`);
    }
    return info;
  } catch (error) {
    console.error(`[EMAIL] Failed: ${error.message}`);
    throw error;
  }
};

module.exports = { initTransporter, sendEmail };
