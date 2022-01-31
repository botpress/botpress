import { clickOn, fillField, expectMatchElement } from '../utils/expectPuppeteer'
import {
  clickOnTreeNode,
  CONFIRM_DIALOG,
  expectStudioApiCallSuccess,
  gotoStudio,
  triggerKeyboardShortcut,
  waitForStudioApiResponse
} from '../utils'

const waitForFilesToLoad = async () =>
  page.waitForFunction('document.querySelectorAll(".bp3-icon-document").length > 0')

describe('Module - Code Editor', () => {
  beforeAll(async () => {
    if (!page.url().includes('studio')) {
      await gotoStudio()
    }
  })

  it('Load Code Editor', async () => {
    await clickOn('#bp-menu_code-editor')
    await expectStudioApiCallSuccess('code-editor/files')
  })

  it('Create new action', async () => {
    await clickOn('#btn-add-action')
    await fillField('#input-name', 'hello.js', { delay: 100 })
    await clickOn('#btn-submit')

    await page.focus('#monaco-editor')
    await page.mouse.click(469, 297)
    await page.waitForTimeout(500) // Required so the editor is correctly focused at the right place
    await page.keyboard.type("const lol = 'hi' //")

    await Promise.all([
      expectStudioApiCallSuccess('code-editor/save', 'POST'),
      expectStudioApiCallSuccess('code-editor/files', 'GET'),
      triggerKeyboardShortcut('s', true)
    ])
  })

  it('Duplicate action', async () => {
    await waitForFilesToLoad()
    await clickOnTreeNode('hello.js', 'right')
    await clickOn('#btn-duplicate')

    await expectStudioApiCallSuccess('code-editor/save', 'POST')
  })

  it('Disable file', async () => {
    await waitForFilesToLoad()
    await clickOnTreeNode('hello_copy.js', 'right')
    await clickOn('#btn-disable')

    await expectStudioApiCallSuccess('code-editor/rename', 'POST')

    const response = await waitForStudioApiResponse('code-editor/files')
    const disabledFile = response['bot.actions'].find((x: { name: string }) => x.name === '.hello_copy.js')
    expect(disabledFile).toBeDefined()
  })

  it('Open two tabs', async () => {
    await waitForFilesToLoad()

    await clickOnTreeNode('bot.config.json', 'left')
    await expectStudioApiCallSuccess('code-editor/readFile', 'POST')
    await expectMatchElement('div[id="bot.config.json"]', { text: 'bot.config.json' })

    await clickOnTreeNode('hello.js', 'left')
    await expectStudioApiCallSuccess('code-editor/readFile', 'POST')
    await expectMatchElement('div[id="hello.js"]', { text: 'hello.js' })
  })

  it('Delete file', async () => {
    await waitForFilesToLoad()
    await clickOnTreeNode('.hello_copy.js', 'right')
    await clickOn('#btn-delete')
    await clickOn(CONFIRM_DIALOG.ACCEPT)

    await expectStudioApiCallSuccess('code-editor/remove', 'POST')

    const response = await waitForStudioApiResponse('code-editor/files')
    expect(response['bot.actions'].find((x: { name: string }) => x.name === '.hello_copy.js')).toBeUndefined()
  })
})
