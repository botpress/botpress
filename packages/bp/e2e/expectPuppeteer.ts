import expectp from 'expect-puppeteer'
import { ElementHandle, Page } from 'puppeteer'

// @ts-ignore Typings doesn't include that method, but we want to leave enough time to process queries
expectp.setDefaultOptions({ timeout: 5000 })

/**
 * Shortcuts to avoid repeating the same stuff each time (95% of the time we use the "page" instance)
 * Typings are not up to date on the lib so they are fixed here temporarily
 */

interface ExpectMatchOptions {
  polling?: string | number
  timeout?: number
}

interface ExpectMatchElementOptions {
  polling?: string | number
  timeout?: number
  text?: string | RegExp
  visible?: boolean
}

interface ExpectClickOptions {
  button?: 'left' | 'middle' | 'right'
  clickCount?: number
  delay?: number
  text?: string
}

export const uploadFile = expectp(page).toUploadFile
export const fillField = expectp(page).toFill

export const expectMatch = async (
  matcher: string | RegExp,
  options?: ExpectMatchOptions,
  instance: Page | ElementHandle = page
) => {
  return expectp(instance).toMatch(matcher as any, options as any)
}

export const expectMatchElement = async (
  selector: string,
  options?: ExpectMatchElementOptions,
  instance: Page | ElementHandle = page
): Promise<ElementHandle> => {
  return (expectp(instance).toMatchElement(selector, options as any) as Promise<unknown>) as Promise<ElementHandle>
}

export const clickOn = async (
  selector: string,
  options?: ExpectClickOptions,
  instance: Page | ElementHandle = page
): Promise<void> => {
  return expectp(instance).toClick(selector, options)
}
