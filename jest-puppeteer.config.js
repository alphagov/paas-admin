// https://github.com/smooth-code/jest-puppeteer/blob/master/packages/jest-environment-puppeteer/README.md#jest-puppeteerconfigjs
const config = {
  launch: {
    headless: false,
    // product: 'chrome',
  },
  browserContext: 'default',
}

module.exports = config;
