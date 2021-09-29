import { Page } from 'puppeteer'

export {}

declare global {
  namespace NodeJS {
    interface Global {
      page: Page
    }
  }
}
