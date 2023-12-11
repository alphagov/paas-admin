export const csp = {
  directives: {
    connectSrc: ['\'self\''],
    defaultSrc: ['\'self\''],
    fontSrc: ['\'self\'', 'data:'],
    frameSrc: ['\'self\''],
    imgSrc: ['\'self\''],
    mediaSrc: ['\'self\''],
    objectSrc: ['\'self\''],
    scriptSrc: [
      '\'self\'',
      '\'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw=\'',
    ],
    styleSrc: ['\'self\''],
  },
};

export default csp;
