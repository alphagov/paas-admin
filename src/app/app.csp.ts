export default {
  directives: {
    defaultSrc: [
      `'none'`,
    ],
    styleSrc: [
      `'self'`,
      `'unsafe-inline'`,
    ],
    scriptSrc: [
      `'self'`,
      'www.google-analytics.com',
      `'sha256-+6WnXIl4mbFTCARd8N3COQmT3bJJmo32N8q8ZSQAIcU='`, // Inline script tag in govuk_template
      `'sha256-G29/qSW/JHHANtFhlrZVDZW1HOkCDRc78ggbqwwIJ2g='`, // Inline script tag in govuk_template
    ],
    imgSrc: [
      `'self'`,
      'www.google-analytics.com',
    ],
    connectSrc: [
      `'self'`,
      'www.google-analytics.com',
    ],
    frameSrc: [
      `'self'`,
    ],
    fontSrc: [
      `'self'`,
      'data:',
    ],
    objectSrc: [
      `'self'`,
    ],
    mediaSrc: [
      `'self'`,
    ],
  },
};
