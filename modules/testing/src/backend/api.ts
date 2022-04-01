import * as sdk from 'botpress/sdk'
import { asyncMiddleware as asyncMw } from 'common/http'
import _ from 'lodash'

import { TestByBot } from './typings'

export default async (bp: typeof sdk, testByBot: TestByBot) => {
  const router = bp.http.createRouterForBot('testing')
  const asyncMiddleware = asyncMw(bp.logger)

  router.get(
    '/scenarios',
    asyncMiddleware(async (req, res) => {
      const scenarios = await testByBot[req.params.botId].getScenarios()
      const status = testByBot[req.params.botId].getState()

      res.send({ scenarios, status })
    })
  )

  router.post(
    '/deleteScenario',
    asyncMiddleware(async (req, res) => {
      if (!req.body.name) {
        return res.sendStatus(400)
      }

      await testByBot[req.params.botId].deleteScenario(req.body.name)

      res.sendStatus(200)
    })
  )

  router.post(
    '/runAll',
    asyncMiddleware(async (req, res) => {
      await testByBot[req.params.botId].executeAll()

      res.sendStatus(200)
    })
  )

  router.post(
    '/run',
    asyncMiddleware(async (req, res) => {
      await testByBot[req.params.botId].executeSingle(req.body.scenario)

      res.sendStatus(200)
    })
  )

  router.post(
    '/startRecording',
    asyncMiddleware(async (req, res) => {
      if (!req.body.userId) {
        return res.sendStatus(400)
      }

      await testByBot[req.params.botId].startRecording(req.body.userId)

      res.sendStatus(200)
    })
  )

  router.post(
    '/stopRecording',
    asyncMiddleware(async (req, res) => {
      const scenario = testByBot[req.params.botId].endRecording()

      res.send(scenario)
    })
  )

  router.post(
    '/saveScenario',
    asyncMiddleware(async (req, res) => {
      const { name, steps } = req.body
      if (!name || !steps || !name.length) {
        return res.sendStatus(400)
      }

      await testByBot[req.params.botId].saveScenario(name, steps)

      res.sendStatus(200)
    })
  )

  router.post(
    '/buildScenario',
    asyncMiddleware(async (req, res) => {
      const scenario = await testByBot[req.params.botId].buildScenario(req.body.eventIds)

      res.send(scenario)
    })
  )

  router.post(
    '/deleteAllScenarios',
    asyncMiddleware(async (req, res) => {
      await testByBot[req.params.botId].deleteAllScenarios()

      return res.sendStatus(200)
    })
  )

  router.post(
    '/incomingEvent',
    asyncMiddleware(async (req, res) => {
      const event = req.body as sdk.IO.IncomingEvent

      const eventState = await testByBot[req.params.botId].processIncomingEvent(event)

      res.send(eventState)
    })
  )

  router.post(
    '/processedEvent',
    asyncMiddleware(async (req, res) => {
      const event = req.body as sdk.IO.IncomingEvent

      await testByBot[req.params.botId].processCompletedEvent(event)

      return res.sendStatus(200)
    })
  )

  router.post(
    '/fetchPreviews',
    asyncMiddleware(async (req, res) => {
      const { elementIds } = req.body
      if (!elementIds || !_.isArray(elementIds)) {
        return res.sendStatus(400)
      }

      const previews = await testByBot[req.params.botId].fetchPreviews(elementIds)

      res.send(previews)
    })
  )
}
