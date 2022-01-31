import { clickOn, fillField } from '../utils/expectPuppeteer'
import { expectStudioApiCallSuccess, gotoStudio, waitForStudioApiResponse } from '../utils'

describe('Studio - Configuration', () => {
  beforeAll(async () => {
    if (!page.url().includes('studio')) {
      await gotoStudio()
    }
  })

  it('Unmount Bot', async () => {
    clickOn('#bp-menu_configuration')

    await fillField('#status', 'Unmounted')
    await page.keyboard.press('Enter')

    await clickOn('#btn-submit')
    await clickOn('#confirm-dialog-accept')

    await waitForStudioApiResponse('test/config', 'GET')
  })

  it('Re-mount Bot', async () => {
    await expectStudioApiCallSuccess('config', 'GET')

    await fillField('#status', 'Published')
    await page.keyboard.press('Enter')
    await clickOn('#btn-submit')

    await waitForStudioApiResponse('test/config', 'GET')
  })
})
