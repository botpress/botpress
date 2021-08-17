import { clickOn, fillField, expectMatch } from '../expectPuppeteer'
import { expectStudioApiCallSuccess, gotoStudio, loginIfNeeded } from '../utils'

describe('Studio - NLU', () => {
  beforeAll(async () => {
    await loginIfNeeded()
    if (!page.url().includes('studio')) {
      await gotoStudio()
    }
  })

  it('Load NLU', async () => {
    await clickOn('#bp-menu_nlu')
    await expectStudioApiCallSuccess('nlu/intents', 'GET')
  })

  it('Create new intent', async () => {
    await clickOn('#btn-create')
    await fillField('#input-intent-name', 'hello_there')

    await Promise.all([expectStudioApiCallSuccess('nlu/intents', 'POST'), clickOn('#btn-submit')])
  })

  it('Create new entity', async () => {
    await clickOn('button', { text: 'Entities' })
    await clickOn('#btn-create')
    await fillField('input[name="name"]', 'cars')

    await Promise.all([expectStudioApiCallSuccess('nlu/entities', 'POST'), clickOn('#entity-submit')])
  })

  it('Train Chatbot', async () => {
    await clickOn('button', { text: 'Train Chatbot' })
    await expectMatch('Training')
    await page.waitFor(7000) // Awaits for a while to give botpress time to train
  })
})
