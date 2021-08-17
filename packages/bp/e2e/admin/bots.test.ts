import axios from 'axios'
import path from 'path'

import { bpConfig } from '../../jest-puppeteer.config'
import { clickOn, expectMatchElement, fillField, uploadFile } from '../expectPuppeteer'
import {
  closeToaster,
  CONFIRM_DIALOG,
  expectAdminApiCallSuccess,
  expectModuleApiCallSuccess,
  gotoAndExpect,
  loginIfNeeded,
  triggerKeyboardShortcut
} from '../utils'

describe('Admin - Bot Management', () => {
  const tempBotId = 'lol-bot'
  const importBotId = 'import-bot'
  const workspaceId = 'default'

  const clickButtonForBot = async (buttonId: string, botId: string) => {
    const botRow = await expectMatchElement('.bp_table-row', { text: botId })
    await clickOn('#btn-menu', undefined, botRow)
    await clickOn(buttonId, undefined)
  }

  beforeAll(async () => {
    await loginIfNeeded()
    await gotoAndExpect(`${bpConfig.host}/admin/workspace/${workspaceId}/bots`)
  })

  it('Import bot from archive', async () => {
    await page.waitFor(200)
    await clickOn('#btn-create-bot')
    await page.waitFor(100)
    await clickOn('#btn-import-bot')
    await fillField('#input-botId', importBotId)
    await uploadFile('input[type="file"]', path.join(__dirname, '../assets/bot-import-test.tgz'))
    await clickOn('#btn-upload')
    await expectAdminApiCallSuccess(`workspace/bots/${importBotId}/import`, 'POST')
  })

  it('Open Bot Analytics', async () => {
    await clickButtonForBot('#btn-apps', importBotId)

    await Promise.all([
      expectModuleApiCallSuccess('analytics', importBotId, 'channel/all', 'GET'),
      clickOn('#btn-menu-analytics')
    ])

    await gotoAndExpect(`${bpConfig.host}/admin/workspace/${workspaceId}/bots`)
  })

  it('Delete imported bot', async () => {
    await clickButtonForBot('#btn-delete', importBotId)

    await page.waitFor(1000)
    await clickOn(CONFIRM_DIALOG.ACCEPT)
    await expectAdminApiCallSuccess(`workspace/bots/${importBotId}/delete`, 'POST')
    await page.waitFor(200)
  })

  it('Create temporary bot', async () => {
    await clickOn('#btn-create-bot')
    await page.waitFor(100)
    await clickOn('#btn-new-bot')

    await fillField('#input-bot-name', tempBotId)
    await fillField('#select-bot-templates', 'Welcome Bot') // Using fill instead of select because options are created dynamically
    await page.keyboard.press('Enter')

    await Promise.all([expectAdminApiCallSuccess('workspace/bots', 'POST'), clickOn('#btn-modal-create-bot')])
  })

  it('Train Warning', async () => {
    await expectModuleApiCallSuccess('nlu', tempBotId, 'training/en', 'GET')
  })

  it('Export bot', async () => {
    await clickButtonForBot('#btn-export', tempBotId)

    const response = await page.waitForResponse(`${bpConfig.host}/api/v2/admin/workspace/bots/${tempBotId}/export`)
    expect(response.status()).toBe(200)

    const responseSize = Number(response.headers()['content-length'])
    expect(responseSize).toBeGreaterThan(100)
  })

  it('Create revision', async () => {
    await Promise.all([
      expectAdminApiCallSuccess(`workspace/bots/${tempBotId}/revisions`, 'POST'),
      clickButtonForBot('#btn-createRevision', tempBotId)
    ])
    await closeToaster()
  })

  it('Rollback revision', async () => {
    await clickButtonForBot('#btn-rollbackRevision', tempBotId)
    await expectMatchElement('#select-revisions')

    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await clickOn('#chk-confirm')

    await Promise.all([
      expectAdminApiCallSuccess(`workspace/bots/${tempBotId}/rollback`, 'POST'),
      clickOn('#btn-submit')
    ])
    await page.waitFor(500)
  })

  it('Delete temporary bot', async () => {
    await clickButtonForBot('#btn-delete', tempBotId)
    await page.waitFor(1000)
    await clickOn(CONFIRM_DIALOG.ACCEPT)
    await expectAdminApiCallSuccess(`workspace/bots/${tempBotId}/delete`, 'POST')
    await page.waitFor(200)
  })

  it('Changes bot converse config to disable public endpoint', async () => {
    await clickOn('#btn-menu-code-editor') // Navigate to admin code editor
    await page.waitFor(1000) // Wait for code editor to display
    await clickOn('span.bp3-button-text', { text: 'Advanced Editor' }) // Display raw editor
    await page.waitFor(500)
    await clickOn('span.bp3-tree-node-label', { text: 'bots' })
    await clickOn('span.bp3-tree-node-label', { text: bpConfig.botId })
    await clickOn('span.bp3-tree-node-label', { text: 'bot.config.json' })
    await page.focus('#monaco-editor')
    await page.mouse.click(500, 100)
    await page.waitFor(500) // Required so the editor is correctly focused at the right place
    await triggerKeyboardShortcut('End', false)
    await page.keyboard.type('"converse": {"enableUnsecuredEndpoint": false},') // Edit bot config
    await clickOn('svg[data-icon="floppy-disk"]')

    let status
    try {
      const resp = await axios.post(`${bpConfig.apiHost}/api/v1/bots/${bpConfig.botId}/converse/test`)
      status = resp.status
    } catch (err) {
      status = err.response.status
    }

    expect(status).toEqual(403)
  })
})
