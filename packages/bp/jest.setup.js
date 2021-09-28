const path = require('path')

jest.setTimeout(process.env.JEST_TIMEOUT || 10000)

global.it = async function(name, func) {
  return test(name, async () => {
    try {
      await func()
    } catch (e) {
      await page.screenshot({ path: path.join(__dirname, '../../', `build/tests/e2e/screenshots/${name}.png`) })
      throw e
    }
  })
}
