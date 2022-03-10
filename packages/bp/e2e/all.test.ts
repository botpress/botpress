import { Frame, HTTPRequest, HTTPResponse, Page } from 'puppeteer'

import { bpConfig } from './assets/config'
import { getPage, waitForHost, shouldLogRequest, getTime, DEFAULT_TIMEOUT } from './utils'
import yn from 'yn'

const test = {
  auth: './admin/auth.test',
  login: './admin/login.test',
  logout: './admin/logout.test',
  admin: {
    ui: './admin/ui.test',
    bots: './admin/bots.test',
    users: './admin/users.test'
  },
  studio: {
    ui: './studio/ui.test',
    flows: './studio/flows.test',
    cms: './studio/cms.test',
    nlu: './studio/nlu.test'
  },
  mod: {
    editor: './modules/code-editor.test',
    testing: './modules/testing.test',
    webchat: './modules/webchat.test'
  }
}

const admin = [test.admin.ui, test.admin.bots]
if (yn(process.env.BP_CONFIG_PRO_ENABLED)) {
  admin.push(test.admin.users)
}

const studio = [test.studio.ui, test.studio.flows, test.studio.cms, test.studio.nlu]
const modules = [test.mod.editor, test.mod.testing, test.mod.webchat]

/** Define test pipelines below */
const allTests = [test.auth, test.login, ...admin, ...studio, ...modules, test.logout]
const studioTests = [test.login, ...studio, test.logout]
const adminTests = [test.login, ...admin, test.logout]
const modulesTests = [test.login, ...modules, test.logout]

// Custom pipeline when testing a  specific part
const customTest = [test.auth, test.login, ...admin, ...studio, test.logout]

const requestHandler = (req: HTTPRequest) => {
  if (shouldLogRequest(req.url())) {
    console.info(`${getTime()} > REQUEST: ${req.method()} ${req.url()}`)
  }
}

const responseHandler = (resp: HTTPResponse) => {
  if (shouldLogRequest(resp.url())) {
    console.info(`${getTime()} < RESPONSE: ${resp.request().method()} ${resp.url()} (${resp.status()})`)
  }
}

const frameNavigatedHandler = (frame: Frame) => {
  if (shouldLogRequest(frame.url())) {
    console.info(`${getTime()} FRAME NAVIGATED: ${frame.url()}`)
  }
}

describe('E2E Tests', () => {
  let page: Page

  beforeAll(async () => {
    // Make sure the timeout value is lower than the JEST_TIMEOUT so that
    // it prints the underlying error not a timeout exceeded error.
    await waitForHost(bpConfig.host, { timeout: DEFAULT_TIMEOUT - 1000 })

    page = await getPage()
    await page.goto(bpConfig.host)
    await page.evaluate(() => {
      window.localStorage.setItem('guidedTour11_9_0', 'true')
    })

    page.on('request', requestHandler)
    page.on('response', responseHandler)
    page.on('framenavigated', frameNavigatedHandler)
  })

  afterAll(() => {
    page?.off('request', requestHandler)
    page?.off('response', responseHandler)
    page?.off('framenavigated', frameNavigatedHandler)
  })

  // Change this to test a different pipeline
  allTests.map(x => require(x))
})
