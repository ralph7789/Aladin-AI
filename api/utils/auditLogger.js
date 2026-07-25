const { logger } = require('@aladin/data-schemas');

/**
 * Audit Logger for Enterprise compliance (SOC2/GDPR e-discovery)
 */
class AuditLogger {
  static async logAction(userId, action, resource, metadata) {
    logger.info(`[AUDIT] User: ${userId} | Action: ${action} | Resource: ${resource}`, metadata);
    // Send to Datadog SIEM (Enterprise Compliance)
    try {
      const axios = require('axios');
      if (process.env.DATADOG_API_KEY) {
        await axios.post(`https://http-intake.logs.datadoghq.com/api/v2/logs?dd-api-key=${process.env.DATADOG_API_KEY}`, {
          ddsource: 'nodejs',
          ddtags: 'env:production,version:1.2.0',
          message: `[AUDIT] User: ${userId} | Action: ${action} | Resource: ${resource}`,
          userId,
          action,
          resource,
          ...metadata
        });
      }
    } catch (e) {
      logger.error('Failed to dispatch audit log to SIEM', e);
    }
  }
}

module.exports = AuditLogger;
