import * as sdk from 'botpress/sdk'
import { Request, Response } from 'express'

import Db, { FlaggedEvent } from './db'

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
}
