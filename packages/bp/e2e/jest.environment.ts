import { Event, State } from 'jest-circus'
import PuppeteerEnvironment from 'jest-environment-puppeteer'
import path from 'path'

class CustomEnvironment extends PuppeteerEnvironment {
  savePath = path.join(__dirname, '../../../', 'build/tests/e2e/screenshots')
  failedTest = false

  async setup() {
    await super.setup()
  }

  async teardown() {
    await super.teardown()
  }

  async handleTestEvent(event: Event, _state: State) {
    if (event.name === 'test_fn_failure') {
      this.failedTest = true

      const filename = path.format({ dir: this.savePath, name: event.test.name, ext: '.png' })

      // Take a screenshot at the point of failure
      await this.global.page.screenshot({ path: filename })
    } else if (this.failedTest && event.name === 'test_start') {
      event.test.mode = 'skip'
    }
  }
}

module.exports = CustomEnvironment
