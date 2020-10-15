import path from 'path'

import { clickOn, expectMatch, expectMatchElement, fillField, uploadFile } from '../expectPuppeteer'
import { CONFIRM_DIALOG, expectBotApiCallSuccess, getElementCenter, gotoStudio, waitForBotApiResponse } from '../utils'

const getQnaCount = async (): Promise<number> => (await page.$$('div[class*="questionWrapper"]')).length

describe('Module - QNA', () => {
  beforeAll(async () => {
    if (!page.url().includes('studio')) {
      await gotoStudio()
    }
  })

  it('Load questions', async () => {
    await clickOn('#bp-menu_qna')
    await expectBotApiCallSuccess('mod/qna//questions')
  })

  it('Create new entry', async () => {
    await clickOn('#btn-create-qna')
    await expectMatch('Contexts')
    await fillField('#input-questions-qna-1', 'are you working?')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.type('I sure am!')
    await page.keyboard.press('Tab')

    await expectBotApiCallSuccess('mod/qna/global/questions', 'POST')
  })

  it('Filter by name', async () => {
    await page.waitFor(300) // Required because the create action clears the filter after it loads new qna
    await Promise.all([
      expectBotApiCallSuccess('mod/qna//questions', 'GET'),
      fillField('#input-search', 'are you working')
    ])
    expect(await getQnaCount()).toBe(1)
  })

  it('Delete entry', async () => {
    await page.waitFor(500)

    await clickOn('button[class*="more-options-btn"]')
    await clickOn('button[class*="delete"]')
    await clickOn(CONFIRM_DIALOG.ACCEPT)
    await expectBotApiCallSuccess('mod/qna//questions', 'POST')
  })

  it('Export to Archive', async () => {
    await clickOn('#btn-export')
    const response = await waitForBotApiResponse('mod/qna//export')
    expect(response).toBeDefined()
    // expect(response.qnas.length).toBeGreaterThan(0)
  })

  // it('Import from JSON', async () => {
  //   await clickOn('#btn-import')
  //   await uploadFile('input[type="file"]', path.join(__dirname, '../assets/qna_22-08-2019.json'))
  //   await clickOn('#btn-next')
  //   await expectBotApiCallSuccess('mod/qna/analyzeImport', 'POST')

  //   await clickOn('#radio-clearInsert')
  //   await clickOn('#btn-submit')
  //   await expectBotApiCallSuccess('mod/qna/import', 'POST')
  //   await expectBotApiCallSuccess('mod/qna/questions', 'GET')
  //   await page.focus('body') // Sets back the focus to the page when the modal is closed
  //   await page.waitFor(300)
  // })
})
