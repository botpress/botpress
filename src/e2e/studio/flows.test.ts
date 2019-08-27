import { clickOn } from '../expectPuppeteer'
import { autoAnswerDialog, clickOnTreeNode, expectBotApiCallSuccess, gotoStudio } from '../utils'

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
    autoAnswerDialog('test_flow')
    await clickOn('#btn-add-flow')
    await expectBotApiCallSuccess('flow')
  })

  it('Rename flow', async () => {
    autoAnswerDialog('test_flow_renamed')
    await clickOnTreeNode('test_flow', 'right')
    await clickOn('#btn-rename')

    await expectBotApiCallSuccess('flow/test_flow_renamed.flow.json', 'PUT')
  })

  it('Delete flow', async () => {
    autoAnswerDialog()
    await clickOnTreeNode('test_flow_renamed', 'right')
    await clickOn('#btn-delete')

    await expectBotApiCallSuccess('flow/test_flow_renamed.flow.json', 'DELETE')
  })

  it('Duplicate flow', async () => {
    autoAnswerDialog('new_duplicated_flow')
    await clickOnTreeNode('memory', 'right')
    await clickOn('#btn-duplicate')

    await expectBotApiCallSuccess('flow', 'POST')
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
