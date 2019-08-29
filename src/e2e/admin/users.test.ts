import { bpConfig } from '../../../jest-puppeteer.config'
import { clickOn, expectMatch, expectMatchElement, fillField } from '../expectPuppeteer'
import { autoAnswerDialog, expectAdminApiCallSuccess, expectCallSuccess, gotoAndExpect } from '../utils'

describe('Admin - Users', () => {
  const testUserEmail = 'someguy@me.com'

  beforeAll(async () => {
    await gotoAndExpect(`${bpConfig.host}/admin/workspace/users`)
  })

  const clickButtonForUser = async (buttonId: string, userId: string) => {
    const botRow = await expectMatchElement('.bp_table-row', { text: userId })
    await clickOn('#btn-menu', undefined, botRow)
    await clickOn(buttonId)
  }

  it('Create a new collaborator', async () => {
    await clickOn('#tab-collaborators')
    await clickOn('#btn-create')
    await fillField('#select-email', testUserEmail)
    await page.keyboard.press('Enter')

    await fillField('#select-role', 'Developer')
    await page.keyboard.press('Enter')

    await clickOn('#btn-submit')

    await expectAdminApiCallSuccess(`users`, 'POST')
    await expectAdminApiCallSuccess(`users`, 'GET')
    await expectMatch('Account created')

    await clickOn('button[aria-label="Close"]')
  })

  it('Reset user password', async () => {
    await page.waitFor(500) // Delay for the collapse animation
    await clickOn('#div-role-dev')

    autoAnswerDialog()
    await clickButtonForUser('#btn-resetPassword', testUserEmail)

    await expectAdminApiCallSuccess(`users/reset/default/${testUserEmail}`, 'GET')
    await expectMatch('Your password has been reset')

    await clickOn('button[aria-label="Close"]')
  })

  it('Change role to administrator', async () => {
    await page.waitFor(500)

    await clickButtonForUser('#btn-changeRole', testUserEmail)
    await fillField('#select-role', 'Administrator')
    await page.keyboard.press('Enter')
    await clickOn('#btn-save')

    await expectAdminApiCallSuccess(`users/workspace/update_role`, 'PUT')
    await expectMatch('Role updated successfully')
  })

  it('Delete created user', async () => {
    await clickOn('#div-role-admin')
    await page.waitFor(500)

    autoAnswerDialog()
    await clickButtonForUser('#btn-deleteUser', testUserEmail)
    await expectAdminApiCallSuccess(`admin/users/default/${testUserEmail}`, 'DELETE')
  })
})
