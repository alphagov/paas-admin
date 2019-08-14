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
      `'sha256-+6WnXIl4mbFTCARd8N3COQmT3bJJmo32N8q8ZSQAIcU='`, // Inline script tag in govuk_template
      `'sha256-G29/qSW/JHHANtFhlrZVDZW1HOkCDRc78ggbqwwIJ2g='`, // Inline script tag in govuk_template
      'www.google-analytics.com',
      'www.googletagmanager.com',
      // Inline script tag for Google Analytics
      `'sha256-R72vvzs/ra+fVicBe+lyndYF4e3bdTEHbbV03txBUtc='`, // Inline script tag in page head
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
