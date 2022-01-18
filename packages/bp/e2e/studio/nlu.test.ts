import { clickOn, fillField, expectMatch } from '../utils/expectPuppeteer'
import { expectStudioApiCallSuccess, gotoStudio, loginOrRegister, NLU_TRAIN_TIMEOUT } from '../utils'

describe('Studio - NLU', () => {
  beforeAll(async () => {
    await loginOrRegister()
    if (!page.url().includes('studio')) {
      await gotoStudio()
    }
  })

  it('Load NLU', async () => {
    await clickOn('#bp-menu_nlu')
    await expectStudioApiCallSuccess('nlu/intents', 'GET')
  })

  it('Create new intent', async () => {
    await clickOn('#btn-create')
    await fillField('#input-intent-name', 'hello_there')

    await clickOn('#btn-submit')
    await expectStudioApiCallSuccess('nlu/intents', 'POST')
  })

  it('Create new entity', async () => {
    await clickOn('button', { text: 'Entities' })
    await clickOn('#btn-create')
    await fillField('input[name="name"]', 'cars')

    await clickOn('#entity-submit')
    await expectStudioApiCallSuccess('nlu/entities', 'POST')
  })

  it(
    'Train Chatbot',
    async () => {
      const client = page['_client']

      const waitForTraining = new Promise((resolve, reject) => {
        const timeout = NLU_TRAIN_TIMEOUT - 1000
        const timeoutHandle = setTimeout(() => {
          client.off('Network.webSocketFrameReceived', onWebSocketFrameReceived)
          reject(new Error(`Failed to train chatbot in under ${timeout / 1000} seconds`))
        }, timeout)

        const onWebSocketFrameReceived = ({ response }) => {
          // E.g. 42/admin,["event",{"name":"statusbar.event","data":{"type":"nlu","botId":"test-bot","trainSession":{"key":"training:test-bot:en","language":"en","status":"done","progress":1}}}]
          const data = response.payloadData as string
          if (data.includes('"status":"done"')) {
            clearTimeout(timeoutHandle)
            client.off('Network.webSocketFrameReceived', onWebSocketFrameReceived)

            resolve(undefined)
          }
        }
        client.on('Network.webSocketFrameReceived', onWebSocketFrameReceived)
      })

      await clickOn('button', { text: 'Train Chatbot' })
      await expectMatch('Training')

      await waitForTraining

      await expectMatch('Ready')
    },
    NLU_TRAIN_TIMEOUT
  )
})
