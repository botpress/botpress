import axios from 'axios'
import * as sdk from 'botpress/sdk'
import { Request, Response } from 'express'

import { FLAGGED_MESSAGE_STATUSES, FlaggedEvent } from '../types'

import Db from './db'

export default async (bp: typeof sdk, db: Db) => {
  const router = bp.http.createRouterForBot('misunderstood')

  router.post('/events', async (req: Request, res: Response) => {
    const { botId } = req.params
    const event: FlaggedEvent = req.body

    if (event.botId !== botId) {
      res.status(403).send('Invalid bot ID')
      return
    }

    try {
      await db.addEvent(event)
      res.sendStatus(201)
    } catch (err) {
      res.status(500).send(err.message)
    }
  })

  router.post('/events/:id/status', async (req: Request, res: Response) => {
    const { id, botId } = req.params
    const { status, ...resolutionData } = req.body

    try {
      await db.updateStatus(botId, id, status, resolutionData)
      res.sendStatus(200)
    } catch (err) {
      res.status(500).send(err.message)
    }
  })

  router.get('/events/count', async (req: Request, res: Response) => {
    const { botId } = req.params
    const { language } = req.query

    try {
      const data = await db.countEvents(botId, language)
      res.json(data)
    } catch (err) {
      res.status(500).send(err.message)
    }
  })

  router.get(`/events/:status(${FLAGGED_MESSAGE_STATUSES.join('|')})`, async (req: Request, res: Response) => {
    const { botId, status } = req.params
    const { language } = req.query

    try {
      const data = await db.listEvents(botId, language, status)
      res.json(data)
    } catch (err) {
      res.status(500).send(err.message)
    }
  })

  router.get('/events/:id(\\d+)', async (req: Request, res: Response) => {
    const { botId, id } = req.params

    try {
      const data = await db.getEventDetails(botId, id)

      if (data) {
        res.json(data)
      } else {
        res.sendStatus(404)
      }
    } catch (err) {
      res.status(500).send(err.message)
    }
  })

  router.post('/apply-all-pending', async (req: Request, res: Response) => {
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
      res.status(500).send(err.message)
    }
  })
}
