import { clickOn, fillField, expectMatchElement, expectMatch } from '../expectPuppeteer'
import {
  clickOnTreeNode,
  CONFIRM_DIALOG,
  expectBotApiCallSuccess,
  expectStudioApiCallSuccess,
  gotoStudio,
  loginIfNeeded
} from '../utils'

describe('Studio - Flows', () => {
  beforeAll(async () => {
    await loginIfNeeded()
    if (!page.url().includes('studio')) {
      await gotoStudio()
    }
  })

  it('Load Flows', async () => {
    await clickOn('#bp-menu_flows')
  })

  it('Create new flow', async () => {
    await clickOn('#btn-add-flow')
    await fillField('#input-flow-name', 'test_flow')
    await Promise.all([expectStudioApiCallSuccess('flows'), clickOn('#btn-submit')])
  })

  it('Create new Node', async () => {
    await page.mouse.click(500, 150)
    await page.mouse.click(500, 150, { button: 'right' })
    await page.waitForSelector('li > .bp3-menu-item > .bp3-text-overflow-ellipsis')
    await page.click('li > .bp3-menu-item > .bp3-text-overflow-ellipsis', { button: 'left' })
  })

  it('Rename Node', async () => {
    await fillField('.bp3-heading + div > div > input', 'node-test')
  })

  it('Copy Node', async () => {
    await page.mouse.click(550, 200)
    page.keyboard.press('Control')
    page.keyboard.press('c')
    await expectMatch('Copied to buffer')
  })

  it('Paste Node', async () => {
    page.keyboard.press('Control')
    page.keyboard.press('v')
    await expectMatch('node-test-copy')
  })

  it('Open node properties', async () => {
    const element = await expectMatchElement('.srd-node--selected', { text: /node-[0-9]*/ })
    await clickOn('div', {}, element)
    await page.waitForSelector('#btn-add-element')
    await clickOn('#btn-add-element')
    await clickOn('.bp3-dialog-close-button')
  })

  it('Check default transition', async () => {
    await page.waitForSelector('#node-props-modal-standard-node-tabs-tab-transitions')
    await clickOn('#node-props-modal-standard-node-tabs-tab-transitions')
    await page.hover('#node-props-modal-standard-node-tabs-pane-transitions > div')
    await clickOn('#node-props-modal-standard-node-tabs-pane-transitions a', { clickCount: 1, text: 'Edit' })
    await clickOn('.bp3-dialog-close-button')
  })

  it('Rename flow', async () => {
    await clickOnTreeNode('test_flow', 'right')
    await clickOn('#btn-rename')
    await fillField('#input-flow-name', 'test_flow_renamed')

    await Promise.all([expectStudioApiCallSuccess('flows/test_flow_renamed.flow.json', 'POST'), clickOn('#btn-submit')])
  })

  it('Delete flow', async () => {
    await clickOnTreeNode('test_flow_renamed', 'right')

    await Promise.all([
      expectStudioApiCallSuccess('flows/test_flow_renamed.flow.json/delete', 'POST'),
      clickOn('#btn-delete'),
      clickOn(CONFIRM_DIALOG.ACCEPT)
    ])
  })

  it('Duplicate flow', async () => {
    await clickOnTreeNode('memory', 'right')
    await clickOn('#btn-duplicate')
    await fillField('#input-flow-name', 'new_duplicated_flow')

    await Promise.all([expectStudioApiCallSuccess('flows', 'POST'), clickOn('#btn-submit')])
    await page.waitFor(3000)
  })
})
