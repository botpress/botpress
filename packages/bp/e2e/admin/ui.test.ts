import path from 'path'

import { bpConfig } from '../assets/config'
import { clickOn, expectMatch, fillField, uploadFile } from '../utils/expectPuppeteer'
import { closeToaster, expectAdminApiCallSuccess, expectCallSuccess, getResponse } from '../utils'

const NEW_PASSWORD = '654321'
const FIRST_NAME = 'Bob'
const LAST_NAME = 'Lalancette'

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

  it('Load languages page', async () => {
    await clickOn('#btn-menu-language')
    await expectAdminApiCallSuccess('management/languages', 'GET')

    await expectMatch('Using lang server at')
    await expectMatch('Installed Languages')
  })

  it('Change user profile', async () => {
    await clickOn('#btn-menu-user-dropdown')
    await clickOn('#btn-profile')

    await fillField('#input-firstname', FIRST_NAME)
    await fillField('#input-lastname', LAST_NAME)

    // Delete existing image if necessary
    const trashButtonSelector = 'span > button > .bp3-icon-trash'
    if ((await page.$(trashButtonSelector)) !== null) {
      await clickOn(trashButtonSelector)
    }
    await uploadFile('input[type="file"]', path.join(__dirname, '../assets/alien.png'))
    const { url } = await expectCallSuccess(`${bpConfig.host}/api/v1/media`, 'POST')

    await clickOn('#btn-submit-update-user')
    await expectCallSuccess(`${bpConfig.host}/api/v2/admin/user/profile`, 'POST')

    const src = await page.$eval('img.dropdown-picture', img => img.getAttribute('src'))
    expect(src?.includes(url)).toBeTruthy()

    await clickOn('#btn-menu-user-dropdown')
    await expectMatch(`Signed in as ${FIRST_NAME} ${LAST_NAME}`)
    await clickOn('#btn-menu-user-dropdown')
  })

  it('Update password', async () => {
    await clickOn('#btn-menu-user-dropdown')
    await clickOn('#btn-changepass')
    await fillField('#input-password', bpConfig.password)
    await fillField('#input-newPassword', NEW_PASSWORD)
    await fillField('#input-confirmPassword', NEW_PASSWORD)

    await clickOn('#btn-submit-update-password')
    await expectCallSuccess(`${bpConfig.host}/api/v2/admin/auth/login/basic/default`, 'POST')
  })

  it('Revert password', async () => {
    await clickOn('#btn-menu-user-dropdown')
    await clickOn('#btn-changepass')
    await fillField('#input-password', NEW_PASSWORD)
    await fillField('#input-newPassword', bpConfig.password)
    await fillField('#input-confirmPassword', bpConfig.password)

    await clickOn('#btn-submit-update-password')
    await expectCallSuccess(`${bpConfig.host}/api/v2/admin/auth/login/basic/default`, 'POST')
  })
})
