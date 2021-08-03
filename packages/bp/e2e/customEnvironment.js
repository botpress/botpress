const PuppeteerEnvironment = require('jest-environment-puppeteer')

class CustomEnvironment extends PuppeteerEnvironment {
  async handleTestEvent(event, state) {
    if (event.name == 'test_fn_failure') {
      const testName = state.currentlyRunningTest.name
      // Take a screenshot at the point of failure
      await this.global.page.screenshot({ path: `build/tests/e2e/screenshots/${testName}.png` })
    }
  }
}
module.exports = CustomEnvironment
