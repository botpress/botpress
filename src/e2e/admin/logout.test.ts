import expectp from 'expect-puppeteer'

import { autoAnswerDialog, expectAdminApiCallSuccess, expectMatchElement, getPage, gotoAndExpect } from '..'
import { bpConfig } from '../../../jest-puppeteer.config'

describe('Admin - Logout', () => {
  const clickButtonForBot = async (buttonId: string) => {
    const botRow = await expectMatchElement('.bp_table-row', { text: bpConfig.botId })
    await expectp(botRow).toClick('.more')
    await expectp(botRow).toClick(buttonId)
  }

  it('Open workspaces page', async () => {
    await gotoAndExpect(`${bpConfig.host}/admin/workspace/bots`)
  })

  it('Delete test bot', async () => {
    if (bpConfig.recreateBot) {
      autoAnswerDialog()
      await clickButtonForBot('#btn-delete')
      await expectAdminApiCallSuccess(`bots/${bpConfig.botId}`, 'DELETE')
    }
  })
})
