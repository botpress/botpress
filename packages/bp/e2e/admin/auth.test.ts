import axios from 'axios'
import * as config from '../assets/auth-config.json'
import { bpConfig } from '../../jest-puppeteer.config'
import { clickOn, fillField } from '../expectPuppeteer'
import { getResponse, doesElementExist } from '../utils'

describe('Auth UI', () => {
  let jwt: string
  let default_content: string

  const request_body = content => {
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
    await expect(page.url().includes('login') || page.url().includes('register')).toBeTruthy()
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
    await page.goto('https://google.com', { waitUntil: 'domcontentloaded' }) // to avoid frontend errors during server reboot
    await expect(resp1.status).toEqual(200)
    default_content = resp1.data.fileContent
    let content = {
      ...JSON.parse(default_content)
    }
    content.pro.licenseKey = bpConfig.licenseKey
    content.pro.enabled = true
    content.pro.externalAuth.enabled = true
    content.pro.collaboratorsAuthStrategies = config.default.pro.collaboratorsAuthStrategies
    content.authStrategies = config.default.authStrategies
    const resp2 = await axios.post(
      `${bpConfig.apiHost}/api/v1/bots/___/mod/code-editor/save`,
      request_body(JSON.stringify(content)),
      headers
    )
    await expect(resp2.status).toEqual(200)
    const resp3 = await axios.post(`${bpConfig.apiHost}/api/v2/admin/management/rebootServer`, { data: {} }, headers)
    await expect(resp3.status).toEqual(200) // reboot is required after adding auth strategies
    await page.waitFor(10000) // wait while server is rebooting
    await page.reload({ waitUntil: ['networkidle0', 'domcontentloaded'] })
    await page.goto(`${bpConfig.host}`, { waitUntil: 'domcontentloaded' })
    await page.reload({ waitUntil: ['networkidle0', 'domcontentloaded'] })
    await clickOn('#btn-menu')
    await clickOn('#btn-logout')
    await getResponse('/api/v2/admin/auth/logout', 'POST')
  })

  it('Preview non-hidden auth strategies', async () => {
    await page.goto(`${bpConfig.host}/admin/login`)
    await expect(await doesElementExist('#btn-default')).toBeTruthy()
    await expect(await doesElementExist('#btn-botpress')).toBeTruthy()
    await expect(await doesElementExist('#btn-botpress2')).toBeFalsy()
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
      request_body(default_content),
      headers
    )
    await expect(resp.status).toEqual(200)
    await clickOn('#btn-menu')
    await clickOn('#btn-logout')
    await getResponse('/api/v2/admin/auth/logout', 'POST')
    await page.reload({ waitUntil: ['networkidle0', 'domcontentloaded'] })
  })
})
