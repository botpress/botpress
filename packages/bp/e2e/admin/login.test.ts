import { bpConfig } from '../../jest-puppeteer.config'
import { clickOn, fillField } from '../expectPuppeteer'
import { expectCallSuccess, getResponse } from '../utils'

describe('Admin - Init', () => {
  it('Load Login page', async () => {
    expect(page.url().includes('login') || page.url().includes('register')).toBeTruthy()
  })

  it('Enter credentials and submit', async () => {
    await fillField('#email', bpConfig.email)
    await fillField('#password', bpConfig.password)

    if (page.url().includes('/register')) {
      await fillField('#confirmPassword', bpConfig.password)
      await clickOn('#btn-register')

      const response = await getResponse(`${bpConfig.apiHost}/api/v2/admin/auth/register/basic/default`, 'POST')
      bpConfig.jwtToken = (await response.json()).payload.jwt
    } else {
      await clickOn('#btn-signin')
      const response = await getResponse(`${bpConfig.apiHost}/api/v2/admin/auth/login/basic/default`, 'POST')
      bpConfig.jwtToken = (await response.json()).payload.jwt
    }
  })

  it('Load workspaces', async () => {
    //  await page.waitForNavigation()
    await page.waitFor(200)
    await expect(page.url()).toMatch(`${bpConfig.host}/admin/workspace/default/bots`)
  })

  if (bpConfig.recreateBot) {
    it('Create test bot', async () => {
      await clickOn('#btn-create-bot')
      await clickOn('#btn-new-bot')

      await fillField('#input-bot-name', bpConfig.botId)
      await fillField('#select-bot-templates', 'Welcome Bot')
      await page.keyboard.press('Enter')

      await Promise.all([
        expectCallSuccess(`${bpConfig.apiHost}/studio/manage/bots/create`, 'POST'),
        clickOn('#btn-modal-create-bot')
      ])
    })
  }
})
