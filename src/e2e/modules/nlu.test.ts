import { clickOn, fillField } from '../expectPuppeteer'
import { autoAnswerDialog, expectBotApiCallSuccess, gotoStudio } from '../utils'

describe('Module - NLU', () => {
  beforeAll(async () => {
    if (!page.url().includes('studio')) {
      await gotoStudio()
    }
  })

  it('Load NLU', async () => {
    await clickOn('#bp-menu_nlu')
    await expectBotApiCallSuccess('mod/nlu/intents', 'GET')
  })

  it('Create new intent', async () => {
    autoAnswerDialog('hello_there')
    await clickOn('button', { text: 'New intent' })
    await expectBotApiCallSuccess('mod/nlu/intents', 'POST')
  })

  it('Create new entity', async () => {
    await clickOn('span', { text: 'Entities' })
    await clickOn('button', { text: 'New entity' })
    await fillField('input[placeholder="Entity name"]', 'cars')
    await clickOn('button', { text: 'Create Entity' })
    await expectBotApiCallSuccess('mod/nlu/entities', 'POST')
  })
})
