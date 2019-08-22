import expectp from 'expect-puppeteer'
import { Dialog, ElementHandle, HttpMethod, MouseButtons, Page } from 'puppeteer'

import { bpConfig } from '../../jest-puppeteer.config'

export let isLoggedOn
export const setLoggedOn = val => (isLoggedOn = val)

// @ts-ignore
expectp.setDefaultOptions({ timeout: 3000 })

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

// Bypass login page if token is set
export const gotoStudio = async (section?: string) => {
  if (isLoggedOn) {
    await gotoAndExpect(`${bpConfig.host}/studio/${bpConfig.botId}${section ? '/' + section : ''}`)
    return page.waitFor(200)
  }

  await page.goto(bpConfig.host)
  await page.evaluate(auth => {
    window.localStorage.setItem('guidedTour11_9_0', 'true')
    if (auth) {
      window.localStorage.setItem('bp/token', auth)
    }
  }, JSON.stringify(bpConfig.authToken))
  await gotoAndExpect(`${bpConfig.host}/studio/${bpConfig.botId}/${section}`)
}

const getResponse = async (url: string, method?: HttpMethod) => {
  return page.waitForResponse(res => res.url().includes(url) && (method ? res.request().method() === method : true))
}

export const expectAdminApiCallSuccess = async (endOfUrl: string, method?: HttpMethod): Promise<void> => {
  const response = await getResponse(`${bpConfig.host}/api/v1/admin/${endOfUrl}`, method)
  expect(response.status()).toBe(200)
}

export const expectBotApiCallSuccess = async (endOfUrl: string, method?: HttpMethod): Promise<void> => {
  const response = await getResponse(`${bpConfig.host}/api/v1/bots/${bpConfig.botId}/${endOfUrl}`, method)
  expect(response.status()).toBe(200)
}

export const waitForBotApiResponse = async (endOfUrl: string, method?: HttpMethod): Promise<any> => {
  const url = `${bpConfig.host}/api/v1/bots/${bpConfig.botId}/${endOfUrl}`
  const response = await page.waitForResponse(
    res => res.url().includes(url) && (method ? res.request().method() === method : true)
  )
  return response.json()
}

export const waitForBotApiCall = async (endOfUrl: string) => {
  const url = `${bpConfig.host}/api/v1/bots/${bpConfig.botId}/${endOfUrl}`
  await page.waitForRequest(req => req.url().includes(url))
}

export const autoAnswerDialog = (promptText?: string, repeat?: boolean) => {
  const dialog = async (dialog: Dialog) => await dialog.accept(promptText)

  if (!repeat) {
    page.once('dialog', dialog)
  } else {
    page.on('dialog', dialog)
    return () => {
      page.off('dialog', dialog)
    }
  }
}

/** Shortcuts to avoid repeating a global variable each time, and workaround missing typings... */
export const clickOn = expectp(page).toClick
export const fillField = expectp(page).toFill

export const expectMatch = async (selector: string | RegExp, options?: any) => {
  return expectp(page).toMatch(selector as any, options)
}

export const expectMatchElement = async (selector: string, options?: any): Promise<ElementHandle> => {
  return expectp(page).toMatchElement(selector, options) as Promise<any>
}

/** Opens a new URL and makes sure the resulting url matches */
export const gotoAndExpect = async (url: string, matchUrl?: string) => {
  await page.goto(url)
  await expect(page.url()).toMatch(matchUrl || url)
}

export const getElementCenter = async (element: ElementHandle): Promise<{ x: number; y: number }> => {
  const box = await element.boundingBox()
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

export const triggerKeyboardShortcut = async (key: string, ctrlKey?: boolean) => {
  if (ctrlKey) {
    await page.keyboard.down('Control')
    await page.keyboard.press(key)
    await page.keyboard.up('Control')
  } else {
    await page.keyboard.press(key)
  }
}

/** Trigger a click on a node containing the specified text */
export const clickOnTreeNode = async (searchText: string, button: MouseButtons = 'left'): Promise<void> => {
  const element = await expectMatchElement('.bp3-tree-node-content', { text: searchText })
  // @ts-ignore typings wrong for button
  await expectp(element).toClick('.bp3-tree-node-label', { button })
}
