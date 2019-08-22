import { autoAnswerDialog, clickOn, clickOnTreeNode, expectBotApiCallSuccess, gotoStudio, waitForBotApiCall } from '..'

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
    await waitForBotApiCall('flow')
  })

  it('Rename flow', async () => {
    autoAnswerDialog('test_flow_renamed')
    await clickOnTreeNode('test_flow', 'right')
    await clickOn('#btn-rename')

    await waitForBotApiCall('flow/test_flow_renamed.flow.json')
  })

  it('Delete flow', async () => {
    autoAnswerDialog()
    await clickOnTreeNode('test_flow_renamed', 'right')
    await clickOn('#btn-delete')

    await expectBotApiCallSuccess('flow/test_flow_renamed.flow.json')
  })

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
