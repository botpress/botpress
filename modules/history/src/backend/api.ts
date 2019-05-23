import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import moment from 'moment'

import Database from './db'

const N_MESSAGE_GROUPS_READ = 10

export default async (bp: typeof sdk, db: Database) => {
  const router = bp.http.createRouterForBot('history')

  router.get('/conversations', async (req, res) => {
    const { botId } = req.params
    const { from, to } = req.query

    const conversationsInfo = await db.getDistinctConversations(botId, from, to)

    res.send(conversationsInfo)
  })

  router.get('/messages/:convId', async (req, res) => {
    const convId = req.params.convId
    const offset = req.query.offset ? req.query.offset : 0

    const { messages, messageCount } = await db.getMessagesOfConversation(convId, N_MESSAGE_GROUPS_READ, offset)

    const messageGroupKeyBuild = (msg: sdk.IO.Event) =>
      msg.direction === 'incoming' ? msg.id : (msg as sdk.IO.OutgoingEvent).incomingEventId
    const messageGroups = _.groupBy(messages, messageGroupKeyBuild)

    const messageGroupsArray = _.sortBy(_.values(messageGroups), mg => moment(mg[0].createdOn).unix()).reverse()

    res.send({ messageGroupsArray, messageCount })
  })
}
