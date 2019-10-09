import { bpConfig } from '../../../jest-puppeteer.config'
import { clickOn, expectMatch, fillField } from '../expectPuppeteer'
import { expectAdminApiCallSuccess, expectCallSuccess, closeToaster } from '../utils'

describe('Admin - UI', () => {
  it('Load server license page', async () => {
    await clickOn('#btn-menu-license')
    await expectMatch(new RegExp('Enable Botpress Professionnal|Cluster fingerprint|Unofficial Botpress Build'))
  })

  it('Load version control page', async () => {
    await clickOn('#btn-menu-version')
    await expectMatch('pull --url http')
    await expectMatch('Push local to this server')
  })

  it('Change user profile', async () => {
    await clickOn('#btn-menu')
    await clickOn('#btn-profile')
    await fillField('#input-firstname', 'Bob')
    await fillField('#input-lastname', 'Lalancette')
    await Promise.all([
      expectCallSuccess(`${bpConfig.host}/api/v1/auth/me/profile`, 'POST'),
      await clickOn('#btn-submit')
    ])
    await closeToaster()
    await clickOn('#btn-menu')
    await expectMatch('Signed in as Bob Lalancette')
  })

  it('Load debugging page', async () => {
    await clickOn('#btn-menu-debug')
    await expectMatch('Configure Debug')

    await clickOn('#btn-refresh')
    await expectAdminApiCallSuccess('server/debug', 'GET')

    await clickOn('#btn-save')
    await expectAdminApiCallSuccess('server/debug', 'POST')
  })

  it('Load languages page', async () => {
    await clickOn('#btn-menu-language')
    await expectMatch('Using lang server at')
    await expectMatch('Installed Languages')
    await expectAdminApiCallSuccess('languages', 'GET')
  })

  it('Update password', async () => {
    await clickOn('#btn-menu')
    await clickOn('#btn-changepass')
    await fillField('#input-password', bpConfig.password)
    await fillField('#input-newPassword', bpConfig.password)
    await fillField('#input-confirmPassword', bpConfig.password)
    await Promise.all([
      expectCallSuccess(`${bpConfig.host}/api/v1/auth/login/basic/default`, 'POST'),
      clickOn('#btn-submit')
    ])
  })
})
