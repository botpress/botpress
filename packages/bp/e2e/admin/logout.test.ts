import axios from 'axios'

import { bpConfig } from '../../jest-puppeteer.config'
import { clickOn, expectMatchElement } from '../expectPuppeteer'
import { CONFIRM_DIALOG, expectAdminApiCallSuccess, getResponse, gotoAndExpect } from '../utils'

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
      await clickButtonForBot('#btn-delete')
      await clickOn(CONFIRM_DIALOG.ACCEPT)
      await expectAdminApiCallSuccess(`workspace/bots/${bpConfig.botId}/delete`, 'POST')
    }
  })

  it('Ensure that the previous token is invalid', async () => {
    await clickOn('#btn-menu')
    await clickOn('#btn-logout')

    const response = await getResponse('/api/v2/admin/auth/logout', 'POST')
    const headers = response.request().headers()

    let profileStatus
    try {
      const { status } = await axios.get(`${bpConfig.host}/api/v2/admin/user/profile`, {
        headers: {
          Authorization: headers.authorization,
          'X-BP-Workspace': 'default'
        }
      })

      profileStatus = status
    } catch (err) {
      profileStatus = err.response.status
    }

    await expect(profileStatus).toBe(401)
  })
})
