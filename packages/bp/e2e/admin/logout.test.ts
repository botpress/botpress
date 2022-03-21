import axios, { AxiosError } from 'axios'

import { bpConfig } from '../assets/config'
import { clickOn } from '../utils/expectPuppeteer'
import { clickButtonForBot, CONFIRM_DIALOG, expectAdminApiCallSuccess, getResponse, gotoAndExpect } from '../utils'

describe('Admin - Logout', () => {
  it('Open workspaces page', async () => {
    await gotoAndExpect(`${bpConfig.host}/admin/workspace/default/bots`)
  })

  if (bpConfig.recreateBot) {
    it('Delete test bot', async () => {
      await clickButtonForBot('#btn-delete-bot-item')
      await clickOn(CONFIRM_DIALOG.ACCEPT)
      await expectAdminApiCallSuccess(`workspace/bots/${bpConfig.botId}/delete`, 'POST')
    })
  }

  it('Ensure that the previous token is invalid', async () => {
    await clickOn('#btn-menu-user-dropdown')
    await clickOn('#btn-logout')

    const response = await getResponse('/api/v2/admin/auth/logout', 'GET')
    const headers = response.request().headers()

    let profileStatus: number
    try {
      const { status } = await axios.get(`${bpConfig.host}/api/v2/admin/user/profile`, {
        headers: {
          Authorization: headers.authorization,
          'X-BP-Workspace': 'default'
        }
      })

      profileStatus = status
    } catch (err) {
      profileStatus = (err as AxiosError).response?.status || 0
    }

    expect(profileStatus).toBe(401)

    await page.waitForNavigation()
  })
})
