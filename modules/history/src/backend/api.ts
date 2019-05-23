import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import moment from 'moment'

import Database from './db'

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
    const ressource = await prepareMessagesRessource(db, convId, 0)
    res.send(ressource)
  })

  router.get('/more-messages/:convId', async (req, res) => {
    const convId = req.params.convId
    const ressource = await prepareMessagesRessource(db, convId)
    res.send(ressource)
  })
}

async function prepareMessagesRessource(db: Database, convId, offset?) {
  const { messages, messageCount } = await db.getNMoreMessagesOfConversation(10, convId, offset)

  const messageGroupKeyBuild = (msg: sdk.IO.Event) =>
    msg.direction === 'incoming' ? msg.id : (msg as sdk.IO.OutgoingEvent).incomingEventId
  const messageGroups = _.groupBy(messages, messageGroupKeyBuild)

  const messageGroupsArray = _.sortBy(_.values(messageGroups), mg => moment(mg[0].createdOn).unix()).reverse()
  return { messageGroupsArray, messageCount }
}
