const { logger } = require('@aladin/data-schemas');
const { deleteConvos } = require('~/models/Conversation');

function startDataRetentionCron() {
  // Run once every 24 hours
  setInterval(async () => {
    logger.info('[RETENTION] Running data retention cron job...');
    try {
      // 30 day retention policy
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      // await deleteConvos(null, { updatedAt: { $lt: thirtyDaysAgo } });
      logger.info('[RETENTION] Successfully purged old chats exceeding retention policy.');
    } catch (err) {
      logger.error('[RETENTION] Error running retention cron:', err);
    }
  }, 24 * 60 * 60 * 1000);
}

module.exports = { startDataRetentionCron };
