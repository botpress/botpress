import expectPuppeteer from 'expect-puppeteer'
import { Page } from 'puppeteer'

import { getPage } from '.'

describe('Integration Tests', () => {
  const EMAIL = 'admin'
  const PASSWORD = '1234qwer'
  const BOT_ID = 'test-bot'
  const BASE_URL = `http://localhost:3000/studio/${BOT_ID}`

  let page: Page

  beforeAll(async () => {
    page = await getPage()
    await page.goto('http://localhost:3000')
  })

  describe('Admin', () => {
    it('loads the login page', async () => {
      expect(page.url().includes('login') || page.url().includes('register')).toBeTruthy()
    })

    it('enters email and password', async () => {
      await expectPuppeteer(page).toFill('#email', EMAIL)
      await expectPuppeteer(page).toFill('#password', PASSWORD)

      if (page.url().includes('/register')) {
        await expectPuppeteer(page).toFill('#confirmPassword', PASSWORD)
        await expectPuppeteer(page).toClick('#btn-register')
      } else {
        await expectPuppeteer(page).toClick('#btn-signin')
      }
    })

    it('loads workspaces page', async () => {
      await page.waitForNavigation()
      await expect(page.url()).toMatch('http://localhost:3000/admin/workspace/bots')
    })

    it('creates a bot', async () => {
      await expectPuppeteer(page).toClick('#btn-create-bot')
      await expectPuppeteer(page).toClick('#btn-new-bot')
      await expectPuppeteer(page).toFill('#input-bot-name', BOT_ID)
      // Using fill instead of select because options are created dynamically
      await expectPuppeteer(page).toFill('#select-bot-templates', 'Welcome Bot')
      await page.keyboard.press('Enter')
      await expectPuppeteer(page).toClick('#btn-modal-create-bot')
      await page.waitForRequest('http://localhost:3000/api/v1/admin/bots')
    })
  })

  describe('Studio', () => {
    it('loads flow editor', async () => {
      const url = `${BASE_URL}/flows`
      await page.goto(url)
      await expect(page.url()).toMatch(url)
    })

    it('loads cms', async () => {
      const url = `${BASE_URL}/content`
      await page.goto(url)
      await expect(page.url()).toMatch(url)
    })

    it('loads nlu', async () => {
      const url = `${BASE_URL}/nlu`
      await page.goto(url)
      await expect(page.url()).toMatch(url)
    })

    it('loads analytics', async () => {
      const url = `${BASE_URL}/analytics`
      await page.goto(url)
      await expect(page.url()).toMatch(url)
    })

    it('loads code-editor', async () => {
      const url = `${BASE_URL}/code-editor`
      await page.goto(url)
      await expect(page.url()).toMatch(url)
    })

    it('loads testing', async () => {
      const url = `${BASE_URL}/testing`
      await page.goto(url)
      await expect(page.url()).toMatch(url)
    })

    it('loads qna', async () => {
      const url = `${BASE_URL}/qna`
      await page.goto(url)
      await expect(page.url()).toMatch(url)
    })

    it('chat in the emulator', async () => {
      await page.keyboard.press('e')
      await expectPuppeteer(page).toFill(
        '#app > div > div:nth-child(1) > div.bpw-layout.bpw-chat-container.bpw-anim-none > div.bpw-msg-list-container > div.bpw-keyboard > div.bpw-composer > div > textarea',
        'much automated!'
      )
      await page.keyboard.press('Enter')
    })
  })

  describe('Admin', () => {
    it('deletes a bot', async () => {
      // Theres a window.confirm dialog when we delete a bot
      await page.on('dialog', async dialog => {
        await dialog.accept()
      })

      await page.goto('http://localhost:3000/admin/workspace/bots')
      // Assumes theres only 1 bot, otherwise this will fail
      await expectPuppeteer(page).toClick('#toggle-menu')
      await expectPuppeteer(page).toClick('#dropdown-delete-bot')
      await page.waitForRequest('http://localhost:3000/api/v1/admin/bots')
    })
  })
})
