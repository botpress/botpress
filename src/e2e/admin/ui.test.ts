import { clickOn, expectAdminApiCallSuccess, expectMatch, gotoAndExpect } from '../'
import { bpConfig } from '../../../jest-puppeteer.config'

describe('Admin - UI', () => {
  const baseUrl = `${bpConfig.host}/admin`

  it('Server License', async () => {
    await gotoAndExpect(`${baseUrl}/server/license`)
    await expectMatch('Enable Botpress Professionnal')
  })

  it('Debugging', async () => {
    await gotoAndExpect(`${baseUrl}/server/debug`)
    await expectMatch('Configure Debug')

    await clickOn('#btn-refresh')
    await expectAdminApiCallSuccess('server/debug', 'GET')

    await clickOn('#btn-save')
    await expectAdminApiCallSuccess('server/debug', 'POST')
  })
})
