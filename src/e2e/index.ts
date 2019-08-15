import { Page } from 'puppeteer'

export const getPage = async (): Promise<Page> => {
  // Some webpages blocks headless browsers
  // @ts-ignore: page is global and set by jest-puppeteer at global setup
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9'
  })
  // @ts-ignore
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36'
  )
  // @ts-ignore
  await page.setViewport({ height: 600, width: 800 })
  // @ts-ignore
  return page
}
