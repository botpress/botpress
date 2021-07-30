import moment = require('moment')
import { Dialog, ElementHandle, HttpMethod, MouseButtons, Page } from 'puppeteer'

import { bpConfig } from '../jest-puppeteer.config'

import { clickOn, expectMatchElement, fillField } from './expectPuppeteer'

export const getPage = async (): Promise<Page> => {
  await page.setViewport(bpConfig.windowSize)
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' })

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36'
  )

  // @ts-ignore
  global.page = page
  return page
}

export const loginIfNeeded = async () => {
  if (page.url().includes('login')) {
    await fillField('#email', bpConfig.email)
    await fillField('#password', bpConfig.password)
    await clickOn('#btn-signin')
    return page.waitForNavigation()
  }
}

export const gotoStudio = async (section?: string) => {
  const resource = section ? `/${section}` : ''
  await gotoAndExpect(`${bpConfig.host}/studio/${bpConfig.botId}${resource}`)
  return page.waitFor(200)
}

/** Opens a new URL and makes sure the resulting url matches */
export const gotoAndExpect = async (url: string, matchUrl?: string) => {
  await page.goto(url)
  await expect(page.url()).toMatch(matchUrl || url)
}

export const getResponse = async (url: string, method?: HttpMethod) => {
  return page.waitForResponse(res => {
    const resUrl = res.url()
    console.info(`url: ${url}, resUrl: ${resUrl}`)
    return resUrl.includes(url) && (method ? res.request().method() === method : true)
  })
}

export const expectCallSuccess = async (url: string, method?: HttpMethod): Promise<any> => {
  const response = await getResponse(url, method)
  expect(response.status()).toBe(200)
  return response.json()
}

export const expectAdminApiCallSuccess = async (endOfUrl: string, method?: HttpMethod): Promise<void> => {
  const response = await getResponse(`${bpConfig.apiHost}/api/v2/admin/${endOfUrl}`, method)
  expect(response.status()).toBe(200)
}

export const expectModuleApiCallSuccess = async (
  module: string,
  bot: string,
  resource: string,
  method?: HttpMethod
): Promise<void> => {
  const response = await getResponse(`${bpConfig.apiHost}/api/v1/bots/${bot}/mod/${module}/${resource}`, method)
  expect(response.status()).toBe(200)
}

export const expectBotApiCallSuccess = async (endOfUrl: string, method?: HttpMethod): Promise<void> => {
  const response = await getResponse(`${bpConfig.apiHost}/api/v1/bots/${bpConfig.botId}/${endOfUrl}`, method)
  expect(response.status()).toBe(200)
}

export const expectStudioApiCallSuccess = async (endOfUrl: string, method?: HttpMethod): Promise<void> => {
  const response = await getResponse(`${bpConfig.apiHost}/api/v1/studio/${bpConfig.botId}/${endOfUrl}`, method)
  expect(response.status()).toBe(200)
}

export const doesElementExist = async (selector: string): Promise<boolean> => {
  try {
    await page.waitForSelector(selector, { timeout: 5000 })
    return true
  } catch (error) {
    return false
  }
}

export const waitForBotApiResponse = async (endOfUrl: string, method?: HttpMethod): Promise<any> => {
  const response = await getResponse(`${bpConfig.apiHost}/api/v1/bots/${bpConfig.botId}/${endOfUrl}`, method)
  return response.json()
}

export enum CONFIRM_DIALOG {
  ACCEPT = '#confirm-dialog-accept',
  DECLINE = '#confirm-dialog-decline'
}

export const autoAnswerDialog = (promptText?: string, repeat?: boolean) => {
  const dialog = async (dialog: Dialog) => dialog.accept(promptText)

  if (!repeat) {
    page.once('dialog', dialog)
  } else {
    page.on('dialog', dialog)
    return () => {
      page.off('dialog', dialog)
    }
  }
}

export const getElementCenter = async (element: ElementHandle): Promise<{ x: number; y: number }> => {
  const box = await element.boundingBox()
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

export const triggerKeyboardShortcut = async (key: string, holdCtrl?: boolean) => {
  //not supported yet by puppetter
  // const ctrlKey = process.platform == 'darwin' ? 'Meta' : 'Control'
  const ctrlKey = 'Control'
  if (holdCtrl) {
    await page.keyboard.down(ctrlKey)
    await page.keyboard.press(key)
    await page.keyboard.up(ctrlKey)
  } else {
    await page.keyboard.press(key)
  }
}

export const clickOnTreeNode = async (searchText: string, button: MouseButtons = 'left'): Promise<void> => {
  const element = await expectMatchElement('.bp3-tree-node-content', { text: searchText })
  await clickOn('.bp3-tree-node-label', { button }, element)
}

export const closeToaster = async () => {
  await clickOn("svg[data-icon='cross']")
  await page.waitForFunction(() => {
    return document.querySelector('.bp3-overlay').childElementCount === 0
  })
  await page.waitFor(500)
}

const shouldLogRequest = (url: string) => {
  const ignoredExt = ['.js', '.mp3', '.png', '.svg', '.css']
  const ignoredWords = ['image/', 'google-analytics', 'css', 'public/js', 'static/js']

  return !ignoredExt.find(x => url.endsWith(x)) && !ignoredWords.find(x => url.includes(x))
}

page.on('request', req => {
  if (shouldLogRequest(req.url())) {
    console.info(`${getTime()} > REQUEST: ${req.method()} ${req.url()}`)
  }
})

page.on('response', resp => {
  if (shouldLogRequest(resp.url())) {
    console.info(`${getTime()} < RESPONSE: ${resp.request().method()} ${resp.url()} (${resp.status()})`)
  }
})

page.on('framenavigated', frame => {
  console.info(`${getTime()} FRAME NAVIGATED: ${frame.url()}`)
})

export const getTime = () => {
  const timeFormat = 'HH:mm:ss.SSS'
  const time = moment().format(timeFormat)
  return time
}
