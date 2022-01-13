import path from 'path'

import { clickOn, fillField, uploadFile } from '../utils/expectPuppeteer'
import {
  CONFIRM_DIALOG,
  expectStudioApiCallSuccess,
  gotoStudio,
  loginOrRegister,
  waitForStudioApiResponse
} from '../utils'

const getElementCount = async (all: boolean = false): Promise<number> => {
  if (all) {
    await page.select('.select-wrap.-pageSizeOptions select', '100')
    await clickOn('#btn-filter-all')
  }
  await page.waitForFunction('document.querySelectorAll(".icon-edit").length > 1')
  return (await page.$$('.icon-edit')).length
}

const BLUEPRINTJS_TEXT_ELEMENT = '.DraftEditor-root'

describe('Studio - CMS', () => {
  beforeAll(async () => {
    await loginOrRegister()
    if (!page.url().includes('studio')) {
      await gotoStudio()
    }
  })

  it('Load CMS', async () => {
    await clickOn('#bp-menu_content')
    await expectStudioApiCallSuccess('cms/elements', 'POST')
  })

  it('Filter text elements', async () => {
    const before = await getElementCount()

    await clickOn('#btn-filter-builtin_text')
    await expectStudioApiCallSuccess('cms/builtin_text/elements', 'POST')

    const after = await getElementCount()
    expect(after).toBeLessThan(before)
  })

  it('Create an image element', async () => {
    const before = await getElementCount(true)

    await page.hover('#btn-filter-builtin_image')
    await clickOn('#btn-list-create-builtin_image')
    await uploadFile('input[type="file"]', path.join(__dirname, '../assets/alien.png'))
    await expectStudioApiCallSuccess('media', 'POST')

    await clickOn(BLUEPRINTJS_TEXT_ELEMENT)
    await page.keyboard.type('I am a martian')

    await clickOn('button[type="submit"]')
    await expectStudioApiCallSuccess('cms/builtin_image/elements', 'POST')

    const after = await getElementCount(true)
    expect(after).toBeGreaterThan(before)
  })

  it('Create a file element', async () => {
    const before = await getElementCount(true)

    await page.hover('#btn-filter-builtin_file')
    await clickOn('#btn-list-create-builtin_file')

    await uploadFile('input[type="file"]', path.join(__dirname, '../assets/README.pdf'))
    await expectStudioApiCallSuccess('media', 'POST')

    await clickOn(BLUEPRINTJS_TEXT_ELEMENT)
    await page.keyboard.type('Botpress README')

    await clickOn('button[type="submit"]')
    await expectStudioApiCallSuccess('cms/builtin_file/elements', 'POST')

    const after = await getElementCount(true)
    expect(after).toBeGreaterThan(before)
  })

  it('Create text element', async () => {
    const before = await getElementCount(true)

    await page.hover('#btn-filter-builtin_text')
    await clickOn('#btn-list-create-builtin_text')

    await clickOn(BLUEPRINTJS_TEXT_ELEMENT)
    await page.keyboard.type('hey!')

    await clickOn('button[type="submit"]')
    await expectStudioApiCallSuccess('cms/builtin_text/element', 'POST')

    const after = await getElementCount(true)
    expect(after).toBeGreaterThan(before)
  })

  it('Search element', async () => {
    await fillField('#input-search', 'hey')

    const response = await waitForStudioApiResponse('cms/elements')
    expect(response.length).toBe(1)
  })

  it('Delete element', async () => {
    await clickOn(`[id^='chk-builtin_text']`)
    await clickOn(`#btn-delete`)
    await clickOn(CONFIRM_DIALOG.ACCEPT)
    await expectStudioApiCallSuccess('cms/elements/bulk_delete', 'POST')
  })
})
