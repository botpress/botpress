import { bpConfig } from '../assets/config'
import { clickOn } from '../utils/expectPuppeteer'
import { expectBotApiCallSuccess, gotoAndExpect, triggerKeyboardShortcut } from '../utils'

describe('Studio - UI', () => {
  it('Open Studio', async () => {
    await gotoAndExpect(`${bpConfig.host}/studio/${bpConfig.botId}`)
  })

  it('Emulator window toggle properly with shortcut', async () => {
    const webchatOpen = '#bp-widget.bp-widget-web.bp-widget-side.emulator'
    const webchatClosed = '#bp-widget.bp-widget-web.bp-widget-widget.emulator.bp-widget-hidden'

    await page.waitForSelector(webchatOpen)
    await page.focus(webchatOpen)
    await page.keyboard.press('Escape')
    await page.waitForSelector(webchatClosed)

    await page.focus('#mainLayout')
    await page.type('#mainLayout', 'e')
    await page.waitForSelector(webchatOpen)

    const frames = page.frames()
    const iframe = frames.find(f => f.url().includes('/lite'))
    if (!iframe) {
      throw new Error('Webchat iframe not found!')
    }
    await iframe.waitForSelector('#input-message')

    await page.keyboard.type('Much automated!')

    await Promise.all([page.keyboard.press('Enter'), expectBotApiCallSuccess('mod/channel-web/messages')])

    await page.keyboard.press('Escape')
  })

  it('Toggle Bottom Panel using shortcut', async () => {
    await page.focus('#mainLayout')
    await triggerKeyboardShortcut('j', true, true)
    const bottomPanel = await page.$('div[data-tab-id="debugger"]')

    expect(await bottomPanel?.isIntersectingViewport()).toBe(true)
    await triggerKeyboardShortcut('j', true, true)
  })

  it('Toggles bottom panel using click toolbar menu', async () => {
    await page.focus('#mainLayout')
    await clickOn('#toggle-bottom-panel')

    const bottomPanel = await page.$('div[data-tab-id="debugger"]')
    expect(await bottomPanel?.isIntersectingViewport()).toBe(true)

    await clickOn('#toggle-bottom-panel')
  })

  // Uncomment once the analytics v2 is enabled by default
  /*it('Load Analytics', async () => {
    await clickOn('#bp-menu_analytics-v2')
    await expectBotApiCallSuccess('mod/analytics-v2/channel/all')
    await expectMatch(/Dashboard/)
    await expectMatch(/Agent Usage/)
    await expectMatch(/Engagement & Retention/)
    await expectMatch(/Understanding/)
  })*/
})
