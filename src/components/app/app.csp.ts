export const csp = {
  directives: {
    connectSrc: ['\'self\'', 'www.google-analytics.com'],
    defaultSrc: ['\'none\''],
    fontSrc: ['\'self\'', 'data:'],
    frameSrc: ['\'self\''],
    imgSrc: ['\'self\'', 'www.google-analytics.com'],
    mediaSrc: ['\'self\''],
    objectSrc: ['\'self\''],
    scriptSrc: [
      '\'self\'',
      '\'sha256-+6WnXIl4mbFTCARd8N3COQmT3bJJmo32N8q8ZSQAIcU=\'',
      'www.google-analytics.com',
      'www.googletagmanager.com',
    ],
    styleSrc: ['\'self\'', '\'unsafe-inline\''],
  },
};

export default csp;
