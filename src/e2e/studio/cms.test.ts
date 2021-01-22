import path from 'path'

import { clickOn, uploadFile } from '../expectPuppeteer'
import { expectBotApiCallSuccess, gotoStudio } from '../utils'

const getElementCount = async (): Promise<number> => {
  return (await page.$$('.icon-edit')).length
}

describe('Studio - CMS', () => {
  beforeAll(async () => {
    if (!page.url().includes('studio')) {
      await gotoStudio()
    }
  })

  it('Load CMS', async () => {
    await clickOn('#bp-menu_Content')
    await expectBotApiCallSuccess('content/elements', 'POST')
  })

  it('Filter text elements', async () => {
    await page.waitForFunction('document.querySelectorAll(".icon-edit").length > 0')
    const before = await getElementCount()

    await clickOn('#btn-filter-builtin_text')
    await expectBotApiCallSuccess('content/builtin_text/elements', 'POST')
    const after = await getElementCount()
    await expect(after).toBeLessThan(before)
  })

  it('Create an image element', async () => {
    const before = await getElementCount()
    await page.waitForSelector('#btn-filter-builtin_image')
    await page.hover('#btn-filter-builtin_image')
    await clickOn('#btn-list-create-builtin_image')
    await uploadFile('input[type="file"]', path.join(__dirname, '../assets/alien.png'))
    await expectBotApiCallSuccess('media', 'POST')
    await clickOn('.style__textarea___2P8hT')
    await page.keyboard.type('We are not the same I am a martian')
    await clickOn('button[type="submit"]')
    await expectBotApiCallSuccess('content/builtin_image/elements', 'POST')
    const after = await getElementCount()
    expect(after).toBeGreaterThan(before)
    //
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
