import { bpConfig } from '../assets/config'
import { clickOn, expectMatch, fillField } from '../utils/expectPuppeteer'
import { closeToaster, CONFIRM_DIALOG, expectAdminApiCallSuccess, gotoAndExpect, clickButtonForUser } from '../utils'

describe('Admin - Users', () => {
  const testUserEmail = 'someguy@me.com'

  beforeAll(async () => {
    await gotoAndExpect(`${bpConfig.host}/admin/workspace/default/users`)
  })

  it('Create a new collaborator', async () => {
    await clickOn('#btn-create-collaborator')
    await clickOn('#select-email')
    await page.type('#select-email', testUserEmail)
    await page.keyboard.press('Enter')

    await clickOn('#select-role')
    await fillField('input[placeholder="Filter..."]', 'Developer')

    await page.keyboard.press('Enter')

    await Promise.all([
      expectAdminApiCallSuccess('workspace/collaborators', 'POST'),
      expectAdminApiCallSuccess('workspace/collaborators?roles=admin,dev,editor,agent,chatuser', 'GET'),
      clickOn('#btn-submit-create-user')
    ])

    await clickOn('button[aria-label="Close"]')
  })

  it('Reset user password', async () => {
    await clickOn('#div-role-dev')

    await clickButtonForUser('#btn-resetPassword', testUserEmail)
    await clickOn(CONFIRM_DIALOG.ACCEPT)
    await expectAdminApiCallSuccess(`workspace/collaborators/reset/default/${testUserEmail}`, 'GET')

    await expectMatch('Your password has been reset')
    await closeToaster()

    await clickOn('button[aria-label="Close"]')
  })

  it('Change role to administrator', async () => {
    await clickButtonForUser('#btn-changeRole', testUserEmail)

    await clickOn('#btn-role-admin')
    await expectAdminApiCallSuccess('workspace/collaborators/workspace/update_role', 'POST')
  })

  it('Delete created user', async () => {
    await clickOn('#div-role-admin')

    await clickButtonForUser('#btn-deleteUser', testUserEmail)
    await clickOn(CONFIRM_DIALOG.ACCEPT)
    await expectAdminApiCallSuccess(`workspace/collaborators/default/${testUserEmail}/delete`, 'POST')
  })
})
