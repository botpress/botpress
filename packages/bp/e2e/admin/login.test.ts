import { bpConfig } from '../assets/config'
import { clickOn, fillField } from '../utils/expectPuppeteer'
import { expectAdminApiCallSuccess, loginOrRegister } from '../utils'

describe('Admin - Init', () => {
  it('Load Login page', async () => {
    expect(page.url().includes('login') || page.url().includes('register')).toBeTruthy()
  })

  it('Enter credentials and submit', async () => {
    await loginOrRegister()
  })

  it('Load workspaces', async () => {
    await page.waitForNavigation()
    await page.waitForSelector('#btn-create-bot')

    expect(page.url()).toMatch(`${bpConfig.host}/admin/workspace/default/bots`)
  })

  if (bpConfig.recreateBot) {
    it('Create test bot', async () => {
      await clickOn('#btn-create-bot')
      await clickOn('#btn-new-bot')

      await fillField('#input-bot-name', bpConfig.botId)

      await clickOn('#select-bot-templates')
      await fillField('#select-bot-templates', 'Welcome Bot')
      await page.keyboard.press('Enter')

      await Promise.all([clickOn('#btn-modal-create-bot'), expectAdminApiCallSuccess('workspace/bots', 'POST')])
    })
  }
})
