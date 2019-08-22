const windowSize = {
  width: 1300,
  height: 900
}

module.exports = {
  launch: {
    headless: false,
    args: [`--window-size=${windowSize.width + 20},${windowSize.height + 20}`]
    // slowMo: 20 // Set this value to slow down tests globally
    // devtools: true // Access the dev tools on the headless chrome
  },
  bpConfig: {
    windowSize,
    email: 'admin',
    password: '123456',
    botId: 'test-bot',
    host: 'http://localhost:3000',
    recreateBot: true,
    botApiUrl: `http://localhost:3000/api/v1/bots/test-bot`,
    // Set this to skip login parts of tests
    authToken: {
      token: '',
      time: '2050-08-21T19:53:41.803Z'
    }
  }
}
