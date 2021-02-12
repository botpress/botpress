import { clickOn, fillField, expectMatch } from '../expectPuppeteer'
import { expectBotApiCallSuccess, gotoStudio } from '../utils'

describe('Module - NLU', () => {
  beforeAll(async () => {
    if (!page.url().includes('studio')) {
      await gotoStudio()
    }
  })

  it('Load NLU', async () => {
    await clickOn('#bp-menu_nlu')
    await expectBotApiCallSuccess('nlu/intents', 'GET')
  })

  it('Create new intent', async () => {
    await clickOn('#btn-add-intent')
    await fillField('#input-intent-name', 'hello_there')

    await Promise.all([expectBotApiCallSuccess('nlu/intents', 'POST'), clickOn('#btn-submit')])
  })

  it('Create new entity', async () => {
    await clickOn('span', { text: 'Entities' })
    await clickOn('button', { text: 'New entity' })
    await fillField('input[name="name"]', 'cars')

    await Promise.all([expectBotApiCallSuccess('nlu/entities', 'POST'), clickOn('#entity-submit')])
  })

  it('Train Chatbot', async () => {
    await clickOn('button', { text: 'Train Chatbot' })
    await expectMatch('Training')
    await page.waitFor(7000) // Awaits for a while to give botpress time to train
  })
})
