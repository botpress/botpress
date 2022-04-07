import { clickOn } from '../utils/expectPuppeteer'
import { expectBotApiCallSuccess, expectStudioApiCallSuccess, gotoStudio } from '../utils'

describe('Studio - Testing', () => {
  beforeAll(async () => {
    if (!page.url().includes('studio')) {
      await gotoStudio()
    }
  })

  it('Load Testing', async () => {
    await clickOn('#bp-menu_testing')
    await expectStudioApiCallSuccess('testing/scenarios', 'GET')
  })
})
