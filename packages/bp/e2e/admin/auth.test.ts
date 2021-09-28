import axios from 'axios'

import authConfig from '../assets/auth-config'
import { bpConfig } from '../../jest-puppeteer.config'
import { clickOn, fillField } from '../expectPuppeteer'
import { getResponse, doesElementExist, expectCallSuccess, waitForHost } from '../utils'
import { BotpressConfig } from '../../src/core/config/botpress.config'

const getHeaders = (token: string) => ({
  headers: {
    Authorization: `Bearer ${token}`
  }
})

const getBody = (content: string) => {
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

const extractTokenFromUrlResponse = async (url: string): Promise<string> => {
  const response = await getResponse(url, 'POST')
  const jsonResponse = (await response.json()) as LoginResponse

  return jsonResponse.payload.jwt
}

interface LoginResponse {
  message: string
  payload: {
    exp: number
    jwt: string
  }
  status: string
}

describe('Auth UI', () => {
  let jwt: string
  let defaultBotpressConfig: string

  it('Load Login page', async () => {
    expect(page.url().includes('login') || page.url().includes('register')).toBeTruthy()
  })

  it('Enter credentials and submit', async () => {
    await fillField('#email', bpConfig.email)
    await fillField('#password', bpConfig.password)

    let url: string
    if (page.url().includes('/register')) {
      await fillField('#confirmPassword', bpConfig.password)
      await clickOn('#btn-register')
      url = `${bpConfig.apiHost}/api/v2/admin/auth/register/basic/default`
    } else {
      await clickOn('#btn-signin')
      url = `${bpConfig.apiHost}/api/v2/admin/auth/login/basic/default`
    }

    jwt = await extractTokenFromUrlResponse(url)
  })

  it('Update config', async () => {
    const headers = getHeaders(jwt)
    const readFileResp = await axios.post(
      `${bpConfig.apiHost}/api/v1/bots/___/mod/code-editor/readFile`,
      {
        name: 'botpress.config.json',
        type: 'main_config',
        location: 'botpress.config.json',
        botId: false
      },
      headers
    )
    expect(readFileResp.status).toEqual(200)
    defaultBotpressConfig = readFileResp.data.fileContent

    const botpressConfig: BotpressConfig = JSON.parse(readFileResp.data.fileContent)
    botpressConfig.pro.licenseKey = bpConfig.licenseKey
    botpressConfig.pro.enabled = true
    botpressConfig.pro.externalAuth.enabled = true
    botpressConfig.pro.collaboratorsAuthStrategies = authConfig.pro.collaboratorsAuthStrategies
    botpressConfig.authStrategies = authConfig.authStrategies

    const saveFileResp = await axios.post(
      `${bpConfig.apiHost}/api/v1/bots/___/mod/code-editor/save`,
      getBody(JSON.stringify(botpressConfig)),
      headers
    )
    expect(saveFileResp.status).toEqual(200)

    // Redirect to avoid frontend errors during server reboot
    await page.goto('chrome://about/')

    // Reboot is required after adding auth strategies
    const rebootResp = await axios.post(`${bpConfig.apiHost}/api/v2/admin/management/rebootServer`, undefined, headers)
    expect(rebootResp.status).toEqual(200)

    await waitForHost(bpConfig.apiHost)
    await page.goto(`${bpConfig.host}`)

    await clickOn('#btn-menu')
    await clickOn('#btn-logout')
    await getResponse('/api/v2/admin/auth/logout', 'POST')
  })

  it('Preview non-hidden auth strategies', async () => {
    await page.goto(`${bpConfig.host}/admin/login`)

    expect(await doesElementExist('#btn-default')).toBeTruthy()
    expect(await doesElementExist('#btn-botpress')).toBeTruthy()
    expect(await doesElementExist('#btn-botpress2')).toBeFalsy()
  })

  it('Revert config', async () => {
    await clickOn('#btn-default')
    await fillField('#email', bpConfig.email)
    await fillField('#password', bpConfig.password)
    await clickOn('#btn-signin')

    const token = await extractTokenFromUrlResponse(`${bpConfig.apiHost}/api/v2/admin/auth/login/basic/default`)

    const saveFileResp = await axios.post(
      `${bpConfig.apiHost}/api/v1/bots/___/mod/code-editor/save`,
      getBody(defaultBotpressConfig),
      getHeaders(token)
    )
    expect(saveFileResp.status).toEqual(200)

    await clickOn('#btn-menu')
    await clickOn('#btn-logout')
    await getResponse('/api/v2/admin/auth/logout', 'POST')
  })
})
