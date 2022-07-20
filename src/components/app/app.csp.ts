export const csp = {
  directives: {
    connectSrc: ['\'self\''],
    defaultSrc: ['\'none\''],
    fontSrc: ['\'self\'', 'data:'],
    frameSrc: ['\'self\''],
    imgSrc: ['\'self\''],
    mediaSrc: ['\'self\''],
    objectSrc: ['\'self\''],
    scriptSrc: [
      '\'self\'',
      '\'sha256-+6WnXIl4mbFTCARd8N3COQmT3bJJmo32N8q8ZSQAIcU=\'',
    ],
    styleSrc: ['\'self\'', '\'unsafe-inline\''],
  },
};

export default csp;
