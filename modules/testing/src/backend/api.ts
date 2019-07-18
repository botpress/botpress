import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { TestByBot } from './typings'

export default async (bp: typeof sdk, testByBot: TestByBot) => {
  const router = bp.http.createRouterForBot('testing')

  router.get('/scenarios', async (req, res) => {
    const scenarios = await testByBot[req.params.botId].getScenarios()
    const status = await testByBot[req.params.botId].getStatus()

    res.send({ scenarios, status })
  })

  router.post('/runAll', async (req, res) => {
    await testByBot[req.params.botId].executeAll()
    res.sendStatus(200)
  })

  router.post('/run', async (req, res) => {
    await testByBot[req.params.botId].executeSingle(req.body.scenario)
    res.sendStatus(200)
  })

  router.get('/startRecording/:userId?', async (req, res) => {
    await testByBot[req.params.botId].startRecording(req.params.userId || '')
    res.sendStatus(200)
  })

  router.get('/stopRecording', async (req, res) => {
    res.send(await testByBot[req.params.botId].endRecording())
  })

  router.post('/saveScenario', async (req, res) => {
    const { name, steps } = req.body
    if (!name || !steps || !name.length) {
      return res.sendStatus(400)
    }

    await testByBot[req.params.botId].saveScenario(name, steps)
    res.sendStatus(200)
  })

  router.post('/buildScenario', async (req, res) => {
    try {
      res.send(await testByBot[req.params.botId].buildScenario(req.body.eventIds))
    } catch (err) {
      res.status(400).send(err.message)
    }
  })

  router.post('/incomingEvent', (req, res) => {
    const event = req.body as sdk.IO.IncomingEvent
    res.send(testByBot[req.params.botId].processIncomingEvent(event))
  })

  router.post('/processedEvent', (req, res) => {
    const event = req.body as sdk.IO.IncomingEvent
    res.send(testByBot[req.params.botId].processCompletedEvent(event))
  })

  router.post('/fetchPreviews', async (req, res) => {
    const { elementIds } = req.body
    if (!elementIds || !_.isArray(elementIds)) {
      return res.sendStatus(400)
    }

    const elements = await bp.cms.getContentElements(req.params.botId, elementIds.map(x => x.replace('#!', '')))
    const rendered = elements.map(element => {
      return {
        id: `#!${element.id}`,
        preview: element.previews.en // TODO: Use the bot's default language instead of hardcoded english
      }
    })

    res.send(rendered)
  })
}
