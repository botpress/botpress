import path from 'path'

import { bpConfig } from '../../../jest-puppeteer.config'
import { clickOn, expectMatchElement, fillField, uploadFile } from '../expectPuppeteer'
import { autoAnswerDialog, expectAdminApiCallSuccess, gotoAndExpect } from '../utils'

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
    await expectAdminApiCallSuccess(`bots/${importBotId}/import`, 'POST')
  })

  it('Delete imported bot', async () => {
    autoAnswerDialog()

    await clickButtonForBot('#btn-delete', importBotId)
    await expectAdminApiCallSuccess(`bots/${importBotId}/delete`, 'POST')
    await page.waitFor(200)
  })

  it('Create temporary bot', async () => {
    await clickOn('#btn-create-bot')
    await page.waitFor(100)
    await clickOn('#btn-new-bot')

    await fillField('#input-bot-name', tempBotId)
    await fillField('#select-bot-templates', 'Welcome Bot') // Using fill instead of select because options are created dynamically
    await page.keyboard.press('Enter')

    await clickOn('#btn-modal-create-bot')
    await expectAdminApiCallSuccess('bots', 'POST')
  })

  it('Export bot', async () => {
    await clickButtonForBot('#btn-export', tempBotId)

    const response = await page.waitForResponse(`${bpConfig.host}/api/v1/admin/bots/${tempBotId}/export`)
    expect(response.status()).toBe(200)

    const responseSize = Number(response.headers()['content-length'])
    expect(responseSize).toBeGreaterThan(100)
  })

  it('Configure bot', async () => {
    const botRow = await expectMatchElement('.bp_table-row', { text: tempBotId })
    await clickOn('.configBtn', undefined, botRow)

    await fillField('#input-name', `${tempBotId} - testing my fabulous bot`)
    await clickOn('#select-status')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await clickOn('#btn-save')
    await expectAdminApiCallSuccess(`bots/${tempBotId}`, 'POST')
    await gotoAndExpect(`${bpConfig.host}/admin/workspace/${workspaceId}/bots`)
  })

  it('Create revision', async () => {
    await clickButtonForBot('#btn-createRevision', tempBotId)
    await expectAdminApiCallSuccess(`bots/${tempBotId}/revisions`, 'POST')
    await page.waitFor(500)
  })

  it('Rollback revision', async () => {
    await clickButtonForBot('#btn-rollbackRevision', tempBotId)

    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await clickOn('#chk-confirm')
    await clickOn('#btn-submit')

    await expectAdminApiCallSuccess(`bots/${tempBotId}/rollback`, 'POST')
    await page.waitFor(500)
  })

  it('Delete temporary bot', async () => {
    autoAnswerDialog()

    await clickButtonForBot('#btn-delete', tempBotId)
    await expectAdminApiCallSuccess(`bots/${tempBotId}/delete`, 'POST')
    await page.waitFor(200)
  })
})
