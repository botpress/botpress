import _ from 'lodash'
import moment from 'moment'

import { SDK } from '.'

export default async (bp: SDK) => {
  const router = bp.http.createRouterForBot('bot-improvement')

  router.get('/sessions/:sessionId', async (req, res) => {
    const sessionId = req.params.sessionId

    const storedEvents = await bp.events.findEvents({ sessionId })

    const messageGroupsMap = {}
    storedEvents.map(e => {
      if (e.direction === 'incoming') {
        const userMessage = e.event
        const messageId = userMessage.id
        messageGroupsMap[messageId] = {
          userMessage,
          botMessages: []
        }
      } else {
        messageGroupsMap[e.incomingEventId!].botMessages.push(e.event)
      }
    })

    let messageGroups = _.values(messageGroupsMap)
    messageGroups = _.sortBy(messageGroups, mg => moment(mg.userMessage.createdOn).unix()).reverse()

    res.send({ messageGroups })
  })
}
