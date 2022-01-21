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
  windowSize
}
