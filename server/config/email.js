const nodemailer = require('nodemailer');

let transporter = null;

if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS !== 'your_gmail_app_password') {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
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
