const { logger } = require('@aladin/data-schemas');

/**
 * Audit Logger for Enterprise compliance (SOC2/GDPR e-discovery)
 */
class AuditLogger {
  static logAction(userId, action, resource, metadata) {
    logger.info(`[AUDIT] User: ${userId} | Action: ${action} | Resource: ${resource}`, metadata);
    // TODO: Send to immutable storage bucket or SIEM (e.g., Datadog, Splunk)
  }
}

module.exports = AuditLogger;
