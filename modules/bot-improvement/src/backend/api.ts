import axios from 'axios'
import * as sdk from 'botpress/sdk'
import { asyncMiddleware as asyncMw } from 'common/http'
import { Response } from 'express'
import _ from 'lodash'
import { Database } from './db'
import { flowsToGoals } from './helpers'
import { FeedbackItem, FlowView, MessageGroup } from './typings'
import { FeedbackItemSchema } from './validation'

interface FeedbackItemsResponse extends Response {
  send: (body: FeedbackItem[]) => FeedbackItemsResponse
}

interface SessionResponse extends Response {
  send: (body: MessageGroup[]) => SessionResponse
}

export default async (bp: typeof sdk, db: Database) => {
  const asyncMiddleware = asyncMw(bp.logger)
  const router = bp.http.createRouterForBot('bot-improvement')

  router.get(
    '/feedback-items',
    asyncMiddleware(async (req, res: FeedbackItemsResponse) => {
      const botId = req.params.botId

      const feedbackItems = await db.getFeedbackItems(botId)

      res.send(feedbackItems)
    })
  )

  router.get(
    '/goals',
    asyncMiddleware(async (req, res) => {
      const axiosConfig = await bp.http.getAxiosConfigForBot(req.params.botId, { localUrl: true, studioUrl: true })
      const flows: FlowView[] = (await axios.get('/flows', axiosConfig)).data
      const goals = flowsToGoals(flows)
      res.send(goals)
    })
  )

  router.post(
    '/feedback-items/:eventId',
    asyncMiddleware(async (req, res) => {
      const { error, value } = FeedbackItemSchema.validate(req.body)
      if (error) {
        return res.status(400).send('Body is invalid')
      }

      const { eventId } = req.params
      const { status, correctedActionType, correctedObjectId } = value

      await db.updateFeedbackItem({ eventId, status, correctedActionType, correctedObjectId })

      res.sendStatus(200)
    })
  )

  router.get(
    '/sessions/:sessionId',
    asyncMiddleware(async (req, res: SessionResponse) => {
      const { sessionId } = req.params

      const messageGroups = await db.getMessageGroups(sessionId)

      res.send(messageGroups)
    })
  )
}
