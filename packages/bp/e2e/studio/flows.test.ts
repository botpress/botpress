import { clickOn, fillField, expectMatch } from '../utils/expectPuppeteer'
import { clickOnTreeNode, CONFIRM_DIALOG, expectStudioApiCallSuccess, gotoStudio, loginOrRegister } from '../utils'

describe('Studio - Flows', () => {
  beforeAll(async () => {
    await loginOrRegister()
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

    await clickOn('#btn-submit')
    await expectStudioApiCallSuccess('flows')
  })

  it('Create new Node', async () => {
    await page.mouse.click(500, 150)
    await page.mouse.click(500, 150, { button: 'right' })

    await clickOn('li > .bp3-menu-item > .bp3-text-overflow-ellipsis', { button: 'left' })
  })

  it('Rename Node', async () => {
    await fillField('#node-name-input', 'node-test')
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
    await clickOn('#btn-add-element')
    await clickOn('.bp3-dialog-close-button')
  })

  it('Rename flow', async () => {
    await clickOnTreeNode('test_flow', 'right')
    await clickOn('#btn-rename')
    await fillField('#input-flow-name', 'test_flow_renamed')

    await clickOn('#btn-submit')
    await expectStudioApiCallSuccess('flows/test_flow_renamed.flow.json', 'POST')
  })

  it('Delete flow', async () => {
    await clickOnTreeNode('test_flow_renamed', 'right')
    await clickOn('#btn-delete')
    await clickOn(CONFIRM_DIALOG.ACCEPT)
    await expectStudioApiCallSuccess('flows/test_flow_renamed.flow.json/delete', 'POST')
  })

  it('Duplicate flow', async () => {
    await clickOnTreeNode('memory', 'right')
    await clickOn('#btn-duplicate')
    await fillField('#input-flow-name', 'new_duplicated_flow')

    await clickOn('#btn-submit')
    await expectStudioApiCallSuccess('flows', 'POST')
  })
})
