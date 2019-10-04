import { bpConfig } from '../../../jest-puppeteer.config'
import { clickOn, expectMatch } from '../expectPuppeteer'
import { expectBotApiCallSuccess, gotoAndExpect, triggerKeyboardShortcut, getTime } from '../utils'

describe('Studio - UI', () => {
  it('Open Studio', async () => {
    await gotoAndExpect(`${bpConfig.host}/studio/${bpConfig.botId}`)
  })

  it('Emulator window toggle properly', async () => {
    await page.waitFor(1000)
    console.log(`${getTime()} Emulator window toggle properly: typing e`)
    await page.type('#mainLayout', 'e')
    console.log(`${getTime()} Emulator window toggle properly: typing much automated`)
    await page.keyboard.type('Much automated!')
    console.log(`${getTime()} Emulator window toggle properly: enter expect`)
    await Promise.all([expectBotApiCallSuccess('mod/channel-web/messages/'), page.keyboard.press('Enter')])
    console.log(`${getTime()} Emulator window toggle properly: escape`)
    await page.keyboard.press('Escape')
  })

  if (process.platform === 'darwin') {
    // TODO (1): Skip this test using native Jest features once https://github.com/facebook/jest/issues/8604 is resolved
    // TODO (2): Activate this test once Puppeteer supports native shortcuts (e.g. `⌘ J`) on OS X
    it.skip('Toggle Logs (SKIPPED ON MAC)', async () => {})
  } else {
    it('Toggle Logs', async () => {
      await page.focus('#mainLayout')
      await triggerKeyboardShortcut('KeyJ', true)
      const bottomPanel = await page.$('div[data-tab-id="bt-panel-logs"]')
      expect(await bottomPanel.isIntersectingViewport()).toBe(true)
      await triggerKeyboardShortcut('KeyJ', true)
    })
  }

  it('Load Analytics', async () => {
    console.log(`${getTime()} Load Analytics: clicking on button`)
    await clickOn('#bp-menu_analytics')
    console.log(`${getTime()} Load Analytics: expecting api call`)
    await expectBotApiCallSuccess('mod/analytics/graphs')
    console.log(`${getTime()} Load Analytics: expecting token`)
    await expectMatch(/Generic Analytics|There are no analytics available yet/)
  })
})
