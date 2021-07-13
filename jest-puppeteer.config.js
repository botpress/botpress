const yn = require('yn')

const windowSize = {
  width: 1300,
  height: 900
}

module.exports = {
  launch: {
    headless: yn(process.env.HEADLESS),
    // +20 so it's a bit bigger than the viewport so nothing is cut
    args: [`--window-size=${windowSize.width + 20},${windowSize.height + 20}`],
    slowMo: 20 // Set this value to slow down tests globally
    // devtools: true // Access the dev tools on the headless chrome
  },
  exitOnPageError: false,
  bpConfig: {
    windowSize,
    email: 'admin',
    password: '123456',
    botId: 'test-bot',
    host: 'http://localhost:3000',
    licenseKey: process.env.BP_LICENSE_KEY, // add license key to env variables
    apiHost: 'http://localhost:3000', // When testing the Admin UI on port 3001, set this to the correct port
    recreateBot: true // When testing something specific, set to false to keep the existing bot
  }
}
