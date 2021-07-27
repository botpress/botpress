import path from 'path'

import { bpConfig } from '../../jest-puppeteer.config'
import { clickOn, expectMatch, fillField, uploadFile } from '../expectPuppeteer'
import { closeToaster, expectAdminApiCallSuccess, expectCallSuccess, getResponse } from '../utils'

describe('Admin - UI', () => {
  it('Load code editor page', async () => {
    await clickOn('#btn-menu-code-editor')
    const response = await getResponse(`${bpConfig.apiHost}/api/v1/bots/___/mod/code-editor/files`, 'GET')
    expect(response.status()).toBe(200)
  })

  it('Load server license page', async () => {
    await clickOn('#btn-menu-license')
    await expectMatch(new RegExp('Enable Botpress Professional|Cluster fingerprint|Unofficial Botpress Build'))
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
    await uploadFile('input[type="file"]', path.join(__dirname, '../assets/alien.png'))
    const { url } = await expectCallSuccess(`${bpConfig.host}/api/v1/media`, 'POST')
    await Promise.all([expectCallSuccess(`${bpConfig.host}/api/v2/admin/user/profile`, 'POST'), clickOn('#btn-submit')])
    await closeToaster()
    const src = await page.$eval('img.dropdown-picture', img => img.getAttribute('src'))
    expect(src.includes(url)).toBeTrue
    await clickOn('#btn-menu')
    await expectMatch('Signed in as Bob Lalancette')
    await clickOn('#btn-menu')
  })

  it('Load languages page', async () => {
    await clickOn('#btn-menu-language')
    await expectMatch('Using lang server at')
    await expectMatch('Installed Languages')
    await expectAdminApiCallSuccess('management/languages', 'GET')
  })

  it('Update password', async () => {
    await clickOn('#btn-menu')
    await clickOn('#btn-changepass')
    await fillField('#input-password', bpConfig.password)
    await fillField('#input-newPassword', bpConfig.password)
    await fillField('#input-confirmPassword', bpConfig.password)
    await Promise.all([
      expectCallSuccess(`${bpConfig.host}/api/v2/admin/auth/login/basic/default`, 'POST'),
      clickOn('#btn-submit')
    ])
  })
})
