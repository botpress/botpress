import { clickOn, fillField } from '../expectPuppeteer'
import { clickOnTreeNode, CONFIRM_DIALOG, expectBotApiCallSuccess, gotoStudio } from '../utils'

describe('Studio - Flows', () => {
  beforeAll(async () => {
    if (!page.url().includes('studio')) {
      await gotoStudio()
    }
  })

  it('Load Flows', async () => {
    await clickOn('#bp-menu_Flows')
  })

  it('Create new flow', async () => {
    await clickOn('#btn-add-flow')
    await fillField('#input-flow-name', 'test_flow')
    await Promise.all([expectBotApiCallSuccess('flow'), clickOn('#btn-submit')])
  })

  it('Rename flow', async () => {
    await clickOnTreeNode('test_flow', 'right')
    await clickOn('#btn-rename')
    await fillField('#input-flow-name', 'test_flow_renamed')

    await Promise.all([expectBotApiCallSuccess('flow/test_flow_renamed.flow.json', 'POST'), clickOn('#btn-submit')])
  })

  it('Delete flow', async () => {
    await clickOnTreeNode('test_flow_renamed', 'right')

    await Promise.all([
      expectBotApiCallSuccess('flow/test_flow_renamed.flow.json/delete', 'POST'),
      clickOn('#btn-delete'),
      clickOn(CONFIRM_DIALOG.ACCEPT)
    ])
  })

  it('Duplicate flow', async () => {
    await clickOnTreeNode('memory', 'right')
    await clickOn('#btn-duplicate')
    await fillField('#input-flow-name', 'new_duplicated_flow')

    await Promise.all([expectBotApiCallSuccess('flow', 'POST'), clickOn('#btn-submit')])
    await page.waitFor(3000)
  })

  // it('Open node properties', async () => {
  //   const element = await expectMatchElement('.srd-node', { text: 'entry' })
  //   // console.log(element)
  //   await clickOn('div', { clickCount: 2 }, element)
  //   await clickOn('#btn-add-element')
  // })

  // // Not working at the moment (puppetteer issue) - Not generating drag events
  // it('Create new node', async () => {
  //   await page.waitFor(500)
  //   const flowTool = await page.$('#btn-tool-standard')
  //   const { x, y } = await getElementCenter(flowTool)

  //   await page.mouse.move(x, y)
  //   await page.mouse.down()
  //   await page.mouse.move(500, 239)
  //   await page.mouse.up()

  //   await page.waitFor(9000)
  // })
})
