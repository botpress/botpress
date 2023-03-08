import axios, { AxiosError } from 'axios'
import path from 'path'

import { bpConfig } from '../assets/config'
import { clickOn, expectMatchElement, fillField, uploadFile } from '../utils/expectPuppeteer'
import {
  clickButtonForBot,
  CONFIRM_DIALOG,
  expectAdminApiCallSuccess,
  expectModuleApiCallSuccess,
  gotoAndExpect,
  loginOrRegister,
  triggerKeyboardShortcut
} from '../utils'

describe('Admin - Bot Management', () => {
  const tempBotId = 'lol-bot'
  const importBotId = 'import-bot'
  const workspaceId = 'default'

  beforeAll(async () => {
    await loginOrRegister()
    await gotoAndExpect(`${bpConfig.host}/admin/workspace/${workspaceId}/bots`)
  })

  it('Import bot from archive', async () => {
    await clickOn('#btn-create-bot')

    await clickOn('#btn-import-bot')

    await fillField('#input-botId', importBotId)
    await uploadFile('input[type="file"]', path.join(__dirname, '../assets/bot-import-test.tgz'))

    await clickOn('#btn-import-bot')
    await expectAdminApiCallSuccess(`workspace/bots/${importBotId}/import`, 'POST')
  })

  it('Open Bot Analytics', async () => {
    await clickButtonForBot('#btn-apps', importBotId)

    await clickOn('#btn-menu-analytics')
    await expectModuleApiCallSuccess('analytics', importBotId, 'channel/all', 'GET')
  })

  it('Delete imported bot', async () => {
    await gotoAndExpect(`${bpConfig.host}/admin/workspace/${workspaceId}/bots`)

    await clickButtonForBot('#btn-delete-bot-item', importBotId)

    await clickOn(CONFIRM_DIALOG.ACCEPT)
    await expectAdminApiCallSuccess(`workspace/bots/${importBotId}/delete`, 'POST')
  })

  it('Create temporary bot', async () => {
    await clickOn('#btn-create-bot')
    await clickOn('#btn-new-bot')

    await fillField('#input-bot-name', tempBotId)

    await clickOn('#select-bot-templates')
    await page.type('#select-bot-templates', 'Small Talk')
    await page.keyboard.press('Enter')

    await clickOn('#btn-modal-create-bot')
    await expectAdminApiCallSuccess('workspace/bots', 'POST')
  })

  it('Train Warning', async () => {
    await expectModuleApiCallSuccess('nlu', tempBotId, 'training/en', 'GET')
  })

  it('Export bot', async () => {
    await clickButtonForBot('#btn-export-bot-item', tempBotId)

    const response = await expectAdminApiCallSuccess(`workspace/bots/${tempBotId}/export`, 'GET')

    const responseSize = Number(response.headers()['content-length'])
    expect(responseSize).toBeGreaterThan(100)
  })

  it('Create revision', async () => {
    await clickButtonForBot('#btn-createRevision-bot-item', tempBotId)
    await expectAdminApiCallSuccess(`workspace/bots/${tempBotId}/revisions`, 'POST')
  })

  it('Rollback revision', async () => {
    // FIXME: Super Hack to make sure the revision is 'ready'
    await page.waitForTimeout(500)

    await clickButtonForBot('#btn-rollbackRevision-bot-item', tempBotId)
    await expectMatchElement('#select-revisions')

    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await clickOn('#chk-confirm')

    await clickOn('#btn-submit-rollback')
    await expectAdminApiCallSuccess(`workspace/bots/${tempBotId}/rollback`, 'POST')
  })

  it('Delete temporary bot', async () => {
    await clickButtonForBot('#btn-delete-bot-item', tempBotId)

    await clickOn(CONFIRM_DIALOG.ACCEPT)
    await expectAdminApiCallSuccess(`workspace/bots/${tempBotId}/delete`, 'POST')
  })

  it('Changes bot converse config to disable public endpoint', async () => {
    await clickOn('#btn-menu-code-editor') // Navigate to admin code editor

    await page.waitForSelector('svg[data-icon="code"]') // Wait for code editor to display
    await clickOn('span.bp3-button-text', { text: 'Advanced Editor' }) // Display raw editor

    await clickOn('span.bp3-tree-node-label', { text: 'bots' })
    await clickOn('span.bp3-tree-node-label', { text: bpConfig.botId })
    await clickOn('span.bp3-tree-node-label', { text: 'bot.config.json' })

    await page.focus('#monaco-editor')
    await page.mouse.click(500, 100)
    await page.waitForTimeout(500) // Required so the editor is correctly focused at the right place
    await triggerKeyboardShortcut('End', false)

    await page.keyboard.type('"converse": {"enableUnsecuredEndpoint": false},') // Edit bot config
    await clickOn('svg[data-icon="floppy-disk"]')

    await page.waitForTimeout(500) // Wait save to complete

    let status: number
    try {
      const resp = await axios.post(`${bpConfig.apiHost}/api/v1/bots/${bpConfig.botId}/converse/test`)
      status = resp.status
    } catch (err) {
      status = (err as AxiosError).response?.status || 0
    }

    expect(status).toEqual(403)
  })
})
