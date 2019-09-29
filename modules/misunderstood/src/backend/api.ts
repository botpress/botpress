import * as sdk from 'botpress/sdk'
import { Request, Response } from 'express'

import Db, { FlaggedEvent, FLAGED_MESSAGE_STATUSES } from './db'

export default async (bp: typeof sdk, db: Db) => {
  const router = bp.http.createRouterForBot('misunderstood')

  router.post('/events', async (req: Request, res: Response) => {
    const { botId } = req.params
    const event: FlaggedEvent = req.body

    if (event.botId !== botId) {
      res.status(403).send('Invalid bot ID')
      return
    }

    await db.addEvent(event)

    res.sendStatus(201)
  })

  router.post('/events/:id/status', async (req: Request, res: Response) => {
    const { id, botId } = req.params
    const status = req.body

    await db.updateStatus(botId, id, status)

    res.sendStatus(201)
  })

  router.get('/events/count', async (req: Request, res: Response) => {
    const { botId } = req.params
    const { language } = req.query

    const data = await db.countEvents(botId, language)

    res.json(data)
  })

  router.get(`/events/:status(${FLAGED_MESSAGE_STATUSES.join('|')})`, async (req: Request, res: Response) => {
    const { botId, status } = req.params
    const { language } = req.query

    const data = await db.listEvents(botId, language, status)

    res.json(data)
  })

  router.get('/events/:id(\\d+)', async (req: Request, res: Response) => {
    const { botId, id } = req.params

    const data = await db.getEventDetails(botId, id)

    res.json(data)
  })
}
