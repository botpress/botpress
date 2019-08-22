import expectp from 'expect-puppeteer'

import {
  autoAnswerDialog,
  clickOn,
  expectBotApiCallSuccess,
  expectMatch,
  fillField,
  getElementCenter,
  gotoStudio,
  waitForBotApiCall
} from '..'

const getQnaCount = async (): Promise<number> => (await page.$$('div[role="entry"]')).length

describe('Module - QNA', () => {
  beforeAll(async () => {
    if (!page.url().includes('studio')) {
      await gotoStudio()
    }
  })

  it('Load QNA', async () => {
    await clickOn('#bp-menu_qna')
    await waitForBotApiCall('mod/qna/questions')
  })

  it('Create new QNA', async () => {
    await clickOn('#btn-add')
    await expectMatch('Create a new Q&A')
    await fillField('#input-questions', 'are you working?')
    await page.keyboard.press('Tab')
    await page.keyboard.type('I sure am!')
    await page.keyboard.press('Enter')
    await clickOn('#btn-submit')
    await expectBotApiCallSuccess('mod/qna/questions', 'POST')
  })

  it('Filter QNA', async () => {
    await page.waitFor(300) // Required so the creation has enough time to load & clear the filter
    await fillField('#input-search', 'are you working')
    await expectBotApiCallSuccess('mod/qna/questions', 'GET')
    await expect(await getQnaCount()).toBe(1)
  })

  it('Delete QNA', async () => {
    autoAnswerDialog()
    const element = await expectp(page).toMatchElement('div[role="entry"]', { text: 'are you working' })
    // @ts-ignore
    const { x, y } = await getElementCenter(element)
    await page.mouse.move(x, y)
    await clickOn('.icon-delete')
    await expectBotApiCallSuccess('mod/qna/questions')
  })
})
