import { clickOn, fillField, expectMatchElement, uploadFile } from '../expectPuppeteer'
import {
  autoAnswerDialog,
  closeToaster,
  expectBotApiCallSuccess,
  expectStudioApiCallSuccess,
  getAxiosClient,
  gotoAndExpect
} from '../utils'
import path from 'path'

import { bpConfig } from '../../jest-puppeteer.config'

const getElementCount = async (all: boolean = false): Promise<number> => {
  if (all) {
    await page.select('.select-wrap.-pageSizeOptions select', '100')
    await clickOn('#btn-filter-all')
  }
  await page.waitForFunction('document.querySelectorAll(".icon-edit").length > 0')
  return (await page.$$('.icon-edit')).length
}

const waitForFilesToLoad = async () =>
  page.waitForFunction('document.querySelectorAll(".bp3-icon-document").length > 0')

describe('Studio - Custom Component', () => {
  it('Open Studio', async () => {
    await gotoAndExpect(`${bpConfig.host}/studio/${bpConfig.botId}`)
  })

  it('Load Code Editor', async () => {
    await clickOn('#bp-menu_code-editor')
    await expectBotApiCallSuccess('mod/code-editor/files')
  })

  it('Upload custom component', async () => {
    await waitForFilesToLoad()
    await clickOn('#btn-upload')
    await uploadFile('input[type="file"]', path.join(__dirname, '../assets/info-source.tgz'))

    await Promise.all([
      expectBotApiCallSuccess('mod/code-editor/upload', 'POST'),
      expectBotApiCallSuccess('mod/code-editor/files', 'GET'),
      clickOn('#btn-submit')
    ])
  })

  it('Remove content type filter from bot', async () => {
    const fileData = {
      name: 'bot.config.json',
      type: 'bot_config',
      location: 'bot.config.json',
      botId: bpConfig.botId
    }

    try {
      const { data } = await getAxiosClient().post(`/api/v1/bots/${bpConfig.botId}/mod/code-editor/readFile`, fileData)

      if (data) {
        const parsed = JSON.parse(data.fileContent)
        delete parsed.contentTypes

        await getAxiosClient().post(`/api/v1/bots/${bpConfig.botId}/mod/code-editor/save`, {
          ...fileData,
          content: JSON.stringify(parsed, undefined, 2)
        })
      }
    } catch (err) {
      console.log(err.response)
    }
  })

  it('Unmount Bot', async () => {
    clickOn('#bp-menu_configuration')

    await fillField('#status', 'Unmounted')
    await page.keyboard.press('Enter')

    await clickOn('#btn-submit')
    await clickOn('#confirm-dialog-accept')
  })

  it('Re-mount Bot', async () => {
    await expectStudioApiCallSuccess('config', 'GET')

    await fillField('#status', 'Published')
    await page.keyboard.press('Enter')
    await clickOn('#btn-submit')

    await page.waitFor(1000)
  })

  it('Load CMS', async () => {
    await clickOn('#bp-menu_content')
    await expectStudioApiCallSuccess('cms/elements', 'POST')
  })

  it('Create an info-source element', async () => {
    const before = await getElementCount(true)

    await page.hover('#btn-filter-info-source')
    await clickOn('#btn-list-create-info-source')

    await page.keyboard.press('Tab')
    await page.keyboard.type('Hello from the other side')

    await clickOn('button[type="submit"]')
    await expectStudioApiCallSuccess('cms/info-source/elements', 'POST')

    const after = await getElementCount(true)
    expect(after).toBeGreaterThan(before)
  })
})
