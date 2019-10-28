import { bpConfig } from '../../../jest-puppeteer.config'
import { clickOn, expectMatchElement } from '../expectPuppeteer'
import { autoAnswerDialog, expectAdminApiCallSuccess, gotoAndExpect } from '../utils'

describe('Admin - Logout', () => {
  const clickButtonForBot = async (buttonId: string) => {
    const botRow = await expectMatchElement('.bp_table-row', { text: bpConfig.botId })
    await clickOn('#btn-menu', undefined, botRow)
    await clickOn(buttonId, undefined)
  }

  it('Open workspaces page', async () => {
    await gotoAndExpect(`${bpConfig.host}/admin/workspace/default/bots`)
  })

  it('Delete test bot', async () => {
    if (bpConfig.recreateBot) {
      autoAnswerDialog()
      await clickButtonForBot('#btn-delete')
      await expectAdminApiCallSuccess(`bots/${bpConfig.botId}/delete`, 'POST')
    }
  })
})
