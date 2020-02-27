import * as sdk from 'botpress/sdk'
import { validate } from 'joi'
import _ from 'lodash'

import { conditionsDefinitions } from './conditions'
import { BotStorage } from './typings'
import { TopicSchema } from './validation'

export default async (bp: typeof sdk, bots: BotStorage) => {
  const router = bp.http.createRouterForBot('ndu')

  router.get('/conditions', async (req, res) => {
    res.send(conditionsDefinitions)
  })

  router.get('/topics', async (req, res) => {
    const storage = bots[req.params.botId]
    res.send(await storage.getTopics())
  })

  router.get('/events', async (req, res) => {
    res.send(
      await bp
        .database('events')
        .select('*')
        .where({ botId: req.params.botId, direction: 'incoming' })
        .orderBy('createdOn', 'desc')
        .limit(100)
    )
  })

  router.post('/topic/:topicName?', async (req, res) => {
    const { topicName } = req.params
    const storage = bots[req.params.botId]

    try {
      const topic = await validate(req.body, TopicSchema)
      const topics: any = await storage.getTopics()

      if (!topicName) {
        await storage.saveTopics([...topics, topic])
      } else {
        await storage.saveTopics([...topics.filter(x => x.name !== topicName), topic])
      }

      res.sendStatus(200)
    } catch (err) {
      res.status(400).send(err)
    }
  })
}
