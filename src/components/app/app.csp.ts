export default {
  directives: {
    defaultSrc: ["'none'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: [
      "'self'",
      "'sha256-+6WnXIl4mbFTCARd8N3COQmT3bJJmo32N8q8ZSQAIcU='",
      'www.google-analytics.com',
      'www.googletagmanager.com',
    ],
    imgSrc: ["'self'", 'www.google-analytics.com'],
    connectSrc: ["'self'", 'www.google-analytics.com'],
    frameSrc: ["'self'"],
    fontSrc: ["'self'", 'data:'],
    objectSrc: ["'self'"],
    mediaSrc: ["'self'"],
  },
};
