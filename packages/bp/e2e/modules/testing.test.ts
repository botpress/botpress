import { clickOn } from '../utils/expectPuppeteer'
import { expectBotApiCallSuccess, gotoStudio } from '../utils'

describe('Module - Testing', () => {
  beforeAll(async () => {
    if (!page.url().includes('studio')) {
      await gotoStudio()
    }
  })

  it('Load Testing', async () => {
    await clickOn('#bp-menu_testing')
    await expectBotApiCallSuccess('mod/testing/scenarios', 'GET')
  })
})
