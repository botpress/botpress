import { bpConfig } from '../assets/config'
import { clickOn, expectMatch, fillField } from '../utils/expectPuppeteer'
import { gotoAndExpect } from '../utils'

const getMessageCount = async (): Promise<number> => {
  return (await page.$$('.bpw-chat-bubble')).length
}

describe('Module - Channel Web', () => {
  it('Open chat window with shortlink', async () => {
    await gotoAndExpect(`${bpConfig.host}/s/${bpConfig.botId}`, `${bpConfig.host}/lite/${bpConfig.botId}/`)
  })

  it('Start conversation', async () => {
    await fillField('#input-message', 'Much automated!')
    await clickOn('#btn-send')
  })

  it('Testing Context discussion and Dropdown', async () => {
    await clickOn('button', { text: 'What is a Context?' })
    await expectMatch("Okay, let's use a simple example. Let's talk about animals. Pick one.")

    await page.waitForSelector('.bpw-keyboard-quick_reply-dropdown div[class*="-placeholder"]')
    const placeholderText = await page.$eval(
      '.bpw-keyboard-quick_reply-dropdown div[class*="-placeholder"]',
      el => el.textContent
    )
    expect(placeholderText).toEqual('Select option...')

    await clickOn('.bpw-keyboard-quick_reply-dropdown div[class*="-container"]')
    await clickOn(`.bpw-keyboard-quick_reply-dropdown div[id^='react-select']:first-child`)
    await expectMatch('Please ask questions about that animal')
  })

  it('Test Before Conversation End Hook and Conversation End Flow', async () => {
    await expectMatch('I will be listening')
  })

  it('Test QNA text markdown', async () => {
    await fillField('#input-message', 'help me')
    await clickOn('#btn-send')
    await expectMatch('a Contextual FAQ,') // Test markdown
  })

  it('Reset conversation', async () => {
    await clickOn('#btn-reset')
    await expectMatch('Reset the conversation')
  })

  it('Create new conversation', async () => {
    await clickOn('#btn-conversations')
    await clickOn('#btn-convo-add')
    await expect(getMessageCount()).resolves.toBe(0)
  })

  // puppetter doesn`t have a way of testing sound playback from javascript objects
  // it('Test disable sound notification', async () => {})
})
