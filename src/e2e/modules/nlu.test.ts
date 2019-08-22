import { clickOn, expectBotApiCallSuccess, gotoStudio } from '..'

describe('Module - NLU', () => {
  beforeAll(async () => {
    if (!page.url().includes('studio')) {
      await gotoStudio()
    }
  })

  it('Load NLU', async () => {
    await clickOn('#bp-menu_nlu')
    await expectBotApiCallSuccess('mod/nlu/intents')
  })
})
