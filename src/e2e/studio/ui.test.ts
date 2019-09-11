import { bpConfig } from '../../../jest-puppeteer.config'
import { clickOn, expectMatch } from '../expectPuppeteer'
import { expectBotApiCallSuccess, gotoAndExpect, triggerKeyboardShortcut } from '../utils'

describe('Studio - UI', () => {
  it('Open Studio', async () => {
    await gotoAndExpect(`${bpConfig.host}/studio/${bpConfig.botId}`)
  })

  it('Emulator window toggle properly', async () => {
    await page.waitFor(1000)
    await page.type('#mainLayout', 'e')
    await page.keyboard.type('Much automated!')
    await page.keyboard.press('Enter')
    await page.keyboard.press('Escape')
    await expectBotApiCallSuccess('mod/channel-web/messages/')
  })

  it('Toggle Logs', async () => {
    await page.focus('#mainLayout')
    await triggerKeyboardShortcut('KeyJ', true)
    const bottomPanel = await page.$('div[data-tab-id="bt-panel-logs"]')
    expect(await bottomPanel.isIntersectingViewport()).toBe(true)
    await triggerKeyboardShortcut('KeyJ', true)
  })

  it('Load Analytics', async () => {
    await clickOn('#bp-menu_analytics')
    await expectBotApiCallSuccess('mod/analytics/graphs')
    await expectMatch(/Generic Analytics|There are no analytics available yet/)
  })
})
