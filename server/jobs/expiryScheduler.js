const cron = require('node-cron');
const Identity = require('../models/Identity');
const Settings = require('../models/Settings');
const AccessLog = require('../models/AccessLog');
const { sendEmail } = require('../config/email');

const startExpiryScheduler = () => {
  cron.schedule('0 7 * * *', async () => {
    console.log('[ExpiryScheduler] Running daily expiry check...');

    try {
      const settings = await Settings.findOne();
      const warningDays = settings?.expiryWarningDays || 30;
      const finalWarningDays = settings?.finalWarningDays || 7;
      const now = new Date();

      const identities = await Identity.find({
        status: { $in: ['Active', 'Pending'] },
      }).populate('user', 'email fullName');

      for (const identity of identities) {
        const daysUntilExpiry = Math.ceil(
          (new Date(identity.expiryDate) - now) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry <= 0) {
          if (identity.status !== 'Expired') {
            identity.status = 'Expired';
            identity.lifecycleHistory.push({
              action: 'Expired',
              performedBy: null,
              reason: 'Auto-expired by system',
              timestamp: new Date(),
            });
            await identity.save();

            await AccessLog.create({
              identity: identity._id,
              user: identity.user?._id,
              action: 'IDENTITY_EXPIRED',
              outcome: 'Success',
              details: 'Identity auto-expired by scheduler',
              performedBy: null,
            });

            if (identity.user && identity.user.email) {
              try {
                await sendEmail({
                  to: identity.user.email,
                  subject: 'Identity Card Expired',
                  html: `<h2>Identity Card Expired</h2>
                    <p>Dear ${identity.fullName}, your digital identity card has expired.</p>
                    <p><strong>Digital ID:</strong> ${identity.digitalIDNumber}</p>
                    <p>Please contact the library administration to renew your identity card.</p>`,
                });
              } catch (err) {
                console.error(`Expiry email failed for ${identity.digitalIDNumber}:`, err.message);
              }
            }
          }
        } else if (daysUntilExpiry <= finalWarningDays && !identity.finalWarningSent) {
          identity.finalWarningSent = true;
          await identity.save();

          if (identity.user && identity.user.email) {
            try {
              await sendEmail({
                to: identity.user.email,
                subject: 'Final Warning: Identity Card Expiring Soon',
                html: `<h2>Final Expiry Warning</h2>
                  <p>Dear ${identity.fullName}, your digital identity card will expire in ${daysUntilExpiry} days.</p>
                  <p><strong>Digital ID:</strong> ${identity.digitalIDNumber}</p>
                  <p><strong>Expiry Date:</strong> ${new Date(identity.expiryDate).toLocaleDateString()}</p>
                  <p>Please renew your identity card immediately to avoid service interruption.</p>`,
              });
              console.log(`Final warning sent to ${identity.user.email}`);
            } catch (err) {
              console.error(`Final warning email failed for ${identity.digitalIDNumber}:`, err.message);
            }
          }
        } else if (daysUntilExpiry <= warningDays && !identity.expiryWarningSent) {
          identity.expiryWarningSent = true;
          await identity.save();

          if (identity.user && identity.user.email) {
            try {
              await sendEmail({
                to: identity.user.email,
                subject: 'Warning: Identity Card Expiring Soon',
                html: `<h2>Expiry Warning</h2>
                  <p>Dear ${identity.fullName}, your digital identity card will expire in ${daysUntilExpiry} days.</p>
                  <p><strong>Digital ID:</strong> ${identity.digitalIDNumber}</p>
                  <p><strong>Expiry Date:</strong> ${new Date(identity.expiryDate).toLocaleDateString()}</p>
                  <p>Please renew your identity card before it expires.</p>`,
              });
              console.log(`Expiry warning sent to ${identity.user.email}`);
            } catch (err) {
              console.error(`Warning email failed for ${identity.digitalIDNumber}:`, err.message);
            }
          }
        }
      }

      console.log(`[ExpiryScheduler] Checked ${identities.length} identities`);
    } catch (error) {
      console.error('[ExpiryScheduler] Error:', error.message);
    }
  });

  console.log('[ExpiryScheduler] Scheduled: daily at 7:00 AM');
};

module.exports = startExpiryScheduler;
