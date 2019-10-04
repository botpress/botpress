import { bpConfig } from '../../../jest-puppeteer.config'
import { clickOn, expectMatch, fillField } from '../expectPuppeteer'
import { expectAdminApiCallSuccess, expectCallSuccess, getTime } from '../utils'

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

  it('Change user profile', async () => {
    console.log(`${getTime()} Change user profile: clicking btn-menu`)
    await clickOn('#btn-menu')
    console.log(`${getTime()} Change user profile: clicking btn-profile`)
    await clickOn('#btn-profile')
    console.log(`${getTime()} Change user profile: filling input-first-name`)
    await fillField('#input-firstname', 'Bob')
    console.log(`${getTime()} Change user profile: filling input-last-name`)
    await fillField('#input-lastname', 'Lalancette')
    console.log(`${getTime()} Change user profile: Awaiting promise`)
    await Promise.all([
      expectCallSuccess(`${bpConfig.host}/api/v1/auth/me/profile`, 'POST'),
      await clickOn('#btn-submit')
    ])
    console.log(`${getTime()} Change user profile: Clicking on cross`)
    await clickOn(".recipe-toaster svg[data-icon='cross']")
    console.log(`${getTime()} Change user profile: Clicking on btn-menu`)
    await page.waitForFunction(() => {
      return document.querySelector('.bp3-overlay').childElementCount === 0
    })
    await clickOn('#btn-menu')
    console.log(`${getTime()} Change user profile: Expecting signed in`)
    await expectMatch('Signed in as Bob Lalancette')
  })

  it('Update password', async () => {
    console.log(`${getTime()} Update password: clicking on btn-menu`)
    await clickOn('#btn-menu')
    console.log(`${getTime()} Update password: clicking on btn-changepass`)
    await clickOn('#btn-changepass')
    console.log(`${getTime()} Update password: filling input-password`)
    await fillField('#input-password', bpConfig.password)
    console.log(`${getTime()} Update password: filling input-newpassword`)
    await fillField('#input-newPassword', bpConfig.password)
    console.log(`${getTime()} Update password: filling input-confirmpassword`)
    await fillField('#input-confirmPassword', bpConfig.password)
    console.log(`${getTime()} Update password: awaiting promise`)
    await Promise.all([
      expectCallSuccess(`${bpConfig.host}/api/v1/auth/login/basic/default`, 'POST'),
      clickOn('#btn-submit')
    ])
  })
})
