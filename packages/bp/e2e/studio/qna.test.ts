import path from 'path'

import { clickOn, expectMatch, expectMatchElement, fillField, uploadFile } from '../utils/expectPuppeteer'
import {
  CONFIRM_DIALOG,
  expectStudioApiCallSuccess,
  getElementCenter,
  gotoStudio,
  waitForBotApiResponse
} from '../utils'

const getQnaCount = async (): Promise<number> => (await page.$$('div[role="entry"]')).length

describe('Studio - QNA', () => {
  beforeAll(async () => {
    if (!page.url().includes('studio')) {
      await gotoStudio()
    }
  })

  it('Load questions', async () => {
    await clickOn('#bp-menu_qna')
    await expectStudioApiCallSuccess('qna/questions')
  })

  it('Filter by category', async () => {
    await fillField('#select-context', 'monkeys')

    await page.keyboard.press('Enter')
    await expectStudioApiCallSuccess('qna/questions?question=&filteredContexts[]=monkeys', 'GET')

    expect(await getQnaCount()).toBe(2)

    await page.keyboard.press('Delete')
    await clickOn("[class^='bp3-tag-remove']")
  })

  it('Create new entry', async () => {
    await clickOn('#btn-create-qna')
    await expectMatch('Create a new')

    await fillField('#input-questions', 'are you working?')
    await page.keyboard.press('Tab')
    await page.keyboard.type('I sure am!')
    await page.keyboard.press('Enter')

    await Promise.all([
      clickOn('#btn-submit'),
      expectStudioApiCallSuccess('qna/questions', 'POST'),
      expectStudioApiCallSuccess('qna/questions', 'GET')
    ])
  })

  it('Filter by name', async () => {
    await fillField('#input-search', 'are you working')
    await expectStudioApiCallSuccess('qna/questions', 'GET')

    expect(await getQnaCount()).toBe(1)
  })

  it('Delete entry', async () => {
    const element = await expectMatchElement('div[role="entry"]', { text: 'are you working' })
    const { x, y } = await getElementCenter(element)
    await page.mouse.move(x, y) // This makes the delete icon visible for the next step

    await clickOn('.bp3-icon-trash')
    await clickOn(CONFIRM_DIALOG.ACCEPT)
    await expectStudioApiCallSuccess('qna/questions', 'POST')
  })

  it('Export to JSON', async () => {
    await clickOn('#btn-export')
    const response = await waitForBotApiResponse('qna/export')
    expect(response).toBeDefined()
    expect(response.qnas.length).toBeGreaterThan(0)
  })

  it('Import from JSON', async () => {
    await clickOn('#btn-importJson')
    await uploadFile('input[type="file"]', path.join(__dirname, '../assets/qna_22-08-2019.json'))
    await clickOn('#btn-next')
    await expectStudioApiCallSuccess('qna/analyzeImport', 'POST')

    await clickOn('#radio-clearInsert')

    await Promise.all([
      clickOn('#btn-submit'),
      expectStudioApiCallSuccess('qna/import', 'POST'),
      expectStudioApiCallSuccess('qna/questions', 'GET')
    ])

    await page.focus('body') // Sets back the focus to the page when the modal is closed
  })
})
