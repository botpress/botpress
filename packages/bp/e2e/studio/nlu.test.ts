import { clickOn, fillField, expectMatch } from '../utils/expectPuppeteer'
import { expectStudioApiCallSuccess, gotoStudio, loginOrRegister } from '../utils'

describe('Studio - NLU', () => {
  beforeAll(async () => {
    await loginOrRegister()
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

    await clickOn('#btn-submit')
    await expectStudioApiCallSuccess('nlu/intents', 'POST')
  })

  it('Create new entity', async () => {
    await clickOn('button', { text: 'Entities' })
    await clickOn('#btn-create')
    await fillField('input[name="name"]', 'cars')

    await clickOn('#entity-submit')
    await expectStudioApiCallSuccess('nlu/entities', 'POST')
  })

  it('Train Chatbot', async () => {
    await clickOn('button', { text: 'Train Chatbot' })
    await expectMatch('Training')

    // TODO: Find something better
    await page.waitFor(7000) // Awaits for a while to give botpress time to train
    await expectMatch('Ready')
  }, 15000)
})
