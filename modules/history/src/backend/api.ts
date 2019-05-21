import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'

import { Config } from '../config'

import Database from './db'

export default async (bp: typeof sdk, db: Database) => {
  const router = bp.http.createRouterForBot('history')

  router.get('/conversations', async (req, res) => {
    const { botId } = req.params
    const { from, to } = req.query

    const config = (await bp.config.getModuleConfigForBot('history', botId)) as Config

    if (config.dataRetention !== 'never') {
      const msTimeToLive = ms(config.dataRetention)
      if (msTimeToLive) {
        const limitDate = moment().subtract(msTimeToLive, 'milliseconds')
        await db.cleanDatabase(limitDate.toDate())
      } else {
        bp.logger.error(
          `config.dataRetention has an incorrect format: '${
            config.dataRetention
          }'. database won't be cleaned up. see ms documentation here 'https://www.npmjs.com/package/ms'`
        )
      }
    }

    const conversationsInfo = await db.getDistinctConversations(botId, from, to)

    res.send(conversationsInfo)
  })

  router.get('/messages/:convId', async (req, res) => {
    const convId = req.params.convId

    const messages = await db.getMessagesOfConversation(convId)

    const messageGroupKeyBuild = msg =>
      msg.direction === 'incoming' ? msg.id : (msg as sdk.IO.OutgoingEvent).incomingEventId
    const messageGroups = _.groupBy(messages, messageGroupKeyBuild)

    let messageGroupsArray = _.values(messageGroups)
    messageGroupsArray = _.sortBy(messageGroupsArray, mg => moment(mg[0].createdOn).unix()).reverse()

    res.send(messageGroupsArray)
  })
}
