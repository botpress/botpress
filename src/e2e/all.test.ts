import { Page } from 'puppeteer'

import { bpConfig } from '../../jest-puppeteer.config'

import { getPage } from '.'

const test = {
  login: './admin/login.test',
  logout: './admin/logout.test',
  admin: {
    ui: './admin/ui.test',
    bots: './admin/bots.test'
  },
  studio: {
    ui: './studio/ui.test',
    flows: './studio/flow.test',
    cms: './studio/cms.test'
  },
  mod: {
    editor: './modules/code-editor.test',
    qna: './modules/qna.test',
    testing: './modules/testing.test',
    nlu: './modules/nlu.test',
    webchat: './modules/webchat.test'
  }
}

const admin = [test.admin.ui, test.admin.bots]
const studio = [test.studio.ui, test.studio.flows, test.studio.cms]
const modules = [test.mod.editor, test.mod.qna, test.mod.testing, test.mod.nlu, test.mod.webchat]

/** Define test pipelines below */
const allTests = [test.login, ...admin, ...studio, ...modules, test.logout]
const studioTests = [test.login, ...studio, test.logout]
const debugTest = [test.login, test.studio.cms, test.logout]

describe('Integration Tests', () => {
  let page: Page

  beforeAll(async () => {
    page = await getPage()
    await page.goto(bpConfig.host)
    await page.evaluate(() => {
      window.localStorage.setItem('guidedTour11_9_0', 'true')
    })
  })

  // Change this to test a different pipeline
  allTests.map(x => require(x))
})
