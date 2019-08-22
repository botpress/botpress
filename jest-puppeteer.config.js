const windowSize = {
  width: 1300,
  height: 900
}

module.exports = {
  launch: {
    headless: false,
    // +20 so it's a bit bigger than the viewport so nothing is cut
    args: [`--window-size=${windowSize.width + 20},${windowSize.height + 20}`]
    // slowMo: 40 // Set this value to slow down tests globally
    // devtools: true // Access the dev tools on the headless chrome
  },
  bpConfig: {
    windowSize,
    email: 'admin',
    password: '123456',
    botId: 'test-bot',
    host: 'http://localhost:3000',
    recreateBot: true // When testing something specific, set to false to keep the existing bot
  }
}
