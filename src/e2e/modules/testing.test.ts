import { clickOn, gotoStudio, waitForBotApiCall } from '..'

describe('Module - Testing', () => {
  beforeAll(async () => {
    if (!page.url().includes('studio')) {
      await gotoStudio()
    }
  })

  it('Load Testing', async () => {
    await clickOn('#bp-menu_testing')
    await waitForBotApiCall('mod/testing/scenarios')
  })
})
