import axios from 'axios'
import * as sdk from 'botpress/sdk'
import { asyncMiddleware as asyncMw, StandardError, UnexpectedError } from 'common/http'
import { Request, Response } from 'express'

import { FlaggedEvent, FLAGGED_MESSAGE_STATUSES } from '../types'

import Db from './db'

export default async (bp: typeof sdk, db: Db) => {
  const asyncMiddleware = asyncMw(bp.logger)
  const router = bp.http.createRouterForBot('misunderstood')

  router.post(
    '/events',
    asyncMiddleware(async (req: Request, res: Response) => {
      const { botId } = req.params
      const event: FlaggedEvent = req.body

      if (event.botId !== botId) {
        throw new StandardError('Invalid bot ID')
      }

      try {
        await db.addEvent(event)
        res.sendStatus(201)
      } catch (err) {
        throw new UnexpectedError('Could not create entry', err)
      }
    })
  )

  router.post(
    '/events/:id/status',
    asyncMiddleware(async (req: Request, res: Response) => {
      const { id, botId } = req.params
      const { status, ...resolutionData } = req.body

      try {
        await db.updateStatus(botId, id, status, resolutionData)
        res.sendStatus(200)
      } catch (err) {
        throw new UnexpectedError('Could not update event', err)
      }
    })
  )

  router.get(
    '/events/count',
    asyncMiddleware(async (req: Request, res: Response) => {
      const { botId } = req.params
      const { language } = req.query

      try {
        const data = await db.countEvents(botId, language)
        res.json(data)
      } catch (err) {
        throw new StandardError(err)
      }
    })
  )

  router.get(
    `/events/:status(${FLAGGED_MESSAGE_STATUSES.join('|')})`,
    asyncMiddleware(async (req: Request, res: Response) => {
      const { botId, status } = req.params
      const { language } = req.query

      try {
        const data = await db.listEvents(botId, language, status)
        res.json(data)
      } catch (err) {
        throw new StandardError('Error listing events', err)
      }
    })
  )

  router.get(
    '/events/:id(\\d+)',
    asyncMiddleware(async (req: Request, res: Response) => {
      const { botId, id } = req.params

      try {
        const data = await db.getEventDetails(botId, id)

        if (data) {
          res.json(data)
        } else {
          res.sendStatus(404)
        }
      } catch (err) {
        throw new StandardError('Error fetching event details', err)
      }
    })
  )

  router.post(
    '/apply-all-pending',
    asyncMiddleware(async (req: Request, res: Response) => {
      const { botId } = req.params

      try {
        await db.applyChanges(botId)
        const axiosConfig = await bp.http.getAxiosConfigForBot(botId, { localUrl: true })
        setTimeout(() => {
          // tslint:disable-next-line: no-floating-promises
          axios.post('/mod/nlu/train', {}, axiosConfig)
        }, 1000)
        res.sendStatus(200)
      } catch (err) {
        throw new StandardError('Could not apply changes', err)
      }
    })
  )
}
