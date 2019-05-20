import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import moment from 'moment'

import { Config } from '../config'

import Database from './db'

export default async (bp: typeof sdk, db: Database) => {
  const router = bp.http.createRouterForBot('history')

  router.get('/conversations', async (req, res) => {
    const { botId } = req.params
    const { from, to } = req.query

    const config = (await bp.config.getModuleConfigForBot('history', botId)) as Config

    const limitDate = moment().subtract(config.dataRetention, 'months')
    await db.cleanDatabase(limitDate.toDate())

    const conversationsInfo = await db.getDistinctConversations(botId, from, to)

    res.send(conversationsInfo)
  })

  router.get('/messages/:convId', async (req, res) => {
    const convId = req.params.convId

    const messages = await db.getMessagesOfConversation(convId)

    const messageGroupKeyBuild = msg =>
      msg.direction === 'incoming' ? msg.id : (msg as sdk.IO.OutgoingEvent).incomingEventId
    const messageGroups = _.groupBy(messages, messageGroupKeyBuild)
    const messageGroupsArray = _.values(messageGroups)

    res.send(messageGroupsArray)
  })
}
