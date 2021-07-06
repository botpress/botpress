import axios from 'axios'
import * as config from '../assets/auth-config.json'
import { bpConfig } from '../../../jest-puppeteer.config'
import { clickOn, fillField } from '../expectPuppeteer'
import { getResponse, gotoAndExpect } from '../utils'

describe('Auth UI', () => {
  config.default.pro.licenseKey = bpConfig.licenseKey
  const content = JSON.stringify(config.default)
  let jwt: string
  let default_content: string

  const sleep = (milliseconds) => {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
  }

  const data = content => {
    return {
      name: 'botpress.config.json',
      type: 'main_config',
      location: 'botpress.config.json',
      botId: false,
      content: content,
      hasChanges: false,
      uri: {
        $mid: 1,
        external: 'bp://files/botpress.config.json',
        path: '/botpress.config.json',
        scheme: 'bp',
        authority: 'files'
      },
      lastSaveVersion: 1
    }
  }

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
      jwt = (await response.json()).payload.jwt
    } else {
      await clickOn('#btn-signin')
      const response = await getResponse(`${bpConfig.apiHost}/api/v2/admin/auth/login/basic/default`, 'POST')
      jwt = (await response.json()).payload.jwt
    }
  })

  it('Update config', async () => {
    const headers = {
      headers: {
        Authorization: `Bearer ${jwt}`
      }
    }
    const resp1 = await axios.post(
      `${bpConfig.apiHost}/api/v1/bots/___/mod/code-editor/readFile`,
      {
        name: 'botpress.config.json',
        type: 'main_config',
        location: 'botpress.config.json',
        botId: false
      },
      headers
    )
    await page.goto('https://google.com', {waitUntil: 'domcontentloaded'}) // to avoid frontend errors during server reboot
    expect(resp1.status).toEqual(200)
    default_content = resp1.data.fileContent
    const resp2 = await axios.post(`${bpConfig.apiHost}/api/v1/bots/___/mod/code-editor/save`, data(content), headers)
    expect(resp2.status).toEqual(200)
    const resp3 = await axios.post(`${bpConfig.apiHost}/api/v2/admin/management/rebootServer`, { data: {} }, headers)
    expect(resp3.status).toEqual(200) // reboot is required after adding auth strategies
    sleep(8000) // wait while server is rebooting
    await page.goto(`${bpConfig.host}/admin/workspace/default/bots`)
  })

  it('Log out', async () => {
    await clickOn('#btn-menu')
    await clickOn('#btn-logout')
    await getResponse('/api/v2/admin/auth/logout', 'POST')
  })

  it('Open login page', async () => {
    await page.goto(`${bpConfig.host}/admin/login/`, {waitUntil: 'domcontentloaded'});
    expect(page.url().includes('login')).toBeTruthy()
  })

  it('Preview non-hidden auth strategies', async () => {
    expect((await page.$('#btn-signin')) == null).toBeTruthy()
    expect((await page.$('#btn-botpress')) !== null).toBeTruthy()
    expect((await page.$('#btn-botpress2')) == null).toBeTruthy()
  })

  it('Revert config', async () => {
    await clickOn('#btn-default')
    await fillField('#email', bpConfig.email)
    await fillField('#password', bpConfig.password)
    await clickOn('#btn-signin')
    const response = await getResponse(`${bpConfig.apiHost}/api/v2/admin/auth/login/basic/default`, 'POST')
    jwt = (await response.json()).payload.jwt
    const headers = {
      headers: {
        Authorization: `Bearer ${jwt}`
      }
    }
    const resp = await axios.post(
      `${bpConfig.apiHost}/api/v1/bots/___/mod/code-editor/save`,
      data(default_content),
      headers
    )
    expect(resp.status).toEqual(200)
    await clickOn('#btn-menu')
    await clickOn('#btn-logout')
    await getResponse('/api/v2/admin/auth/logout', 'POST')
  })
})
