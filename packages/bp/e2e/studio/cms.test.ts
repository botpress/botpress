import path from 'path'

import { clickOn, uploadFile } from '../expectPuppeteer'
import { expectBotApiCallSuccess, expectStudioApiCallSuccess, gotoStudio, loginIfNeeded } from '../utils'

const getElementCount = async (all: boolean = false): Promise<number> => {
  if (all) {
    await page.select('.select-wrap.-pageSizeOptions select', '100')
    await clickOn('#btn-filter-all')
  }
  await page.waitForFunction('document.querySelectorAll(".icon-edit").length > 0')
  return (await page.$$('.icon-edit')).length
}

describe('Studio - CMS', () => {
  beforeAll(async () => {
    await loginIfNeeded()
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
    await clickOn('.DraftEditor-root')
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
    await clickOn('.style__textarea___2P8hT')
    await page.keyboard.type('Botpress README')
    await clickOn('button[type="submit"]')
    await expectStudioApiCallSuccess('cms/builtin_file/elements', 'POST')
    const after = await getElementCount(true)
    expect(after).toBeGreaterThan(before)
  })

  // it('Create text element', async () => {

  //   await page.keyboard.press('Tab')
  //   await page.keyboard.type('hey!')
  //   await clickOn('button[type="submit"]')

  //   await expectBotApiCallSuccess('content/builtin_text/element', 'POST')
  //   await page.waitFor(500) // Ensure the element is created and the list is reloaded
  //   const after = await getElementCount()

  //   expect(after).toBe(before + 1)
  // })

  // it('Search element', async () => {
  //   await page.waitFor(1000)
  //   await fillField('#input-search', 'hey')

  //   const response = await waitForBotApiResponse('content/builtin_text/elements')
  //   expect(response.length).toBe(1)
  // })

  // it('Delete element', async () => {
  //   await clickOn(`[id^='chk-builtin_text']`)
  //   await clickOn(`#btn-delete`)
  //   await clickOn(CONFIRM_DIALOG.ACCEPT)
  //   await expectBotApiCallSuccess('content/elements/bulk_delete', 'POST')
  // })
})
