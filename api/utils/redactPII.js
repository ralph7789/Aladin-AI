// Simple regex-based PII Redactor for SSN, Phone, Email
// TODO: Replace with Microsoft Presidio or AWS Comprehend Medical API
const piiRegexes = [
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
  /\b[\w.-]+@[\w.-]+\.\w{2,4}\b/g, // Email
  /\b(?:\+?1[-.●]?)?\(?([0-9]{3})\)?[-.●]?([0-9]{3})[-.●]?([0-9]{4})\b/g // Phone
];

function redactPII(text) {
  if (typeof text !== 'string') return text;
  let redacted = text;
  piiRegexes.forEach(regex => {
    redacted = redacted.replace(regex, '[REDACTED PII]');
  });
  return redacted;
}

module.exports = { redactPII };
