/* eslint-disable max-lines-per-function */
import { mkRespond } from 'src/api-utils'
import { getOrCreateFlow, setFlow } from '../flow-state'
import { Client, ClientOutputs, MessageHandler } from '../types'
import * as bp from '.botpress'

type User = ClientOutputs['getUser']['user']
type StartHitlInput = bp.zendesk.actions.startHitl.input.Input
type MessageHistoryElement = NonNullable<StartHitlInput['messageHistory']>[number]

class UserLinker {
  public constructor(private _users: Record<string, User>, private _client: Client) {}

  public async getDownstreamUserId(upstreamUserId: string): Promise<string> {
    let upstreamUser = this._users[upstreamUserId]
    if (!upstreamUser) {
      const { user: fetchedUser } = await this._client.getUser({ id: upstreamUserId })
      this._users[upstreamUserId] = fetchedUser
      upstreamUser = fetchedUser
    }

    if (upstreamUser.tags.downstream) {
      return upstreamUser.tags.downstream
    }

    const {
      downstreamUser: { id: downstreamUserId },
      upstreamUser: updatedUpstreamUser,
    } = await this._linkUser(upstreamUser)

    this._users[upstreamUserId] = updatedUpstreamUser

    return downstreamUserId
  }

  private async _linkUser(upstreamUser: User) {
    const {
      output: { userId: downstreamUserId },
    } = await this._client.callAction({
      type: 'zendesk:createUser',
      input: {
        name: upstreamUser.name,
        pictureUrl: upstreamUser.pictureUrl,
        email: upstreamUser.tags.email,
      },
    })

    const { user: updatedUpstreamUser } = await this._client.updateUser({
      id: upstreamUser.id,
      tags: {
        downstream: downstreamUserId,
      },
    })

    const { user: updatedDownstreamUser } = await this._client.updateUser({
      id: downstreamUserId,
      tags: {
        upstream: upstreamUser.id,
      },
    })

    return {
      upstreamUser: updatedUpstreamUser,
      downstreamUser: updatedDownstreamUser,
    }
  }
}

export const patientMessageHandler: MessageHandler = async (props) => {
  if (props.message.type !== 'text') {
    return
  }

  const respond = mkRespond(props)
  const { message, client, conversation: upstreamConversation, user: upstreamUser } = props

  const upstreamFlow = await getOrCreateFlow(
    { client, conversationId: upstreamConversation.id },
    { hitlEnabled: false }
  )

  const users = new UserLinker(
    {
      [upstreamUser.id]: upstreamUser,
    },
    client
  )

  if (!upstreamFlow.hitlEnabled) {
    if (message.payload.text.trim() === '/start_hitl') {
      respond({ conversationId: upstreamConversation.id, text: 'Transferring you to a human agent...' })

      const downstreamUserId = await users.getDownstreamUserId(upstreamUser.id)

      const { messages: upstreamMessages } = await client.listMessages({
        conversationId: upstreamConversation.id,
      })
      upstreamMessages.reverse() // TODO: use createdAt to sort instead of reverse

      const messageHistory: MessageHistoryElement[] = []
      for (const message of upstreamMessages) {
        const source =
          message.direction === 'outgoing'
            ? { type: 'bot' }
            : {
                type: 'user',
                userId: await users.getDownstreamUserId(message.userId),
              }
        messageHistory.push({
          source,
          type: message.type,
          payload: message.payload,
        } as MessageHistoryElement)
      }

      const {
        output: { conversationId: downstreamConversationId },
      } = await client.callAction({
        type: 'zendesk:startHitl',
        input: {
          title: `Hitl request ${Date.now()}`,
          description: 'I need help.',
          userId: downstreamUserId,
          messageHistory,
        },
      })

      await client.updateConversation({
        id: upstreamConversation.id,
        tags: {
          downstream: downstreamConversationId,
        },
      })

      await client.updateConversation({
        id: downstreamConversationId,
        tags: {
          upstream: upstreamConversation.id,
        },
      })

      await setFlow({ client, conversationId: upstreamConversation.id }, { hitlEnabled: true })
      await setFlow({ client, conversationId: downstreamConversationId }, { hitlEnabled: true })
      await respond({ conversationId: upstreamConversation.id, text: 'You are now connected to a human agent.' })
      return
    }

    await respond({
      conversationId: upstreamConversation.id,
      text: [
        'Hi, I am a bot.',
        'I cannot answer your questions.',
        'Type `/start_hitl` to talk to a human agent.',
        'Have fun :)',
      ].join('\n'),
    })
    return
  }

  const downstreamConversationId = upstreamConversation.tags['downstream']
  if (!downstreamConversationId) {
    console.error('Upstream conversation was not binded to downstream conversation')
    await respond({
      conversationId: upstreamConversation.id,
      text: 'Something went wrong, you are not connected to a human agent...',
    })
    return
  }

  const downstreamUserId = upstreamUser.tags['downstream']
  if (!downstreamUserId) {
    console.error('Upstream user was not binded to downstream user')
    await respond({
      conversationId: upstreamConversation.id,
      text: 'Something went wrong, you are not connected to a human agent...',
    })
    return
  }

  if (message.payload.text.trim() === '/stop_hitl') {
    try {
      await respond({
        conversationId: upstreamConversation.id,
        text: 'Closing ticket...',
      })
      await props.client.callAction({
        type: 'zendesk:stopHitl',
        input: {
          conversationId: downstreamConversationId,
        },
      })
      await respond({
        conversationId: upstreamConversation.id,
        text: 'Ticket closed...',
      })
    } finally {
      await setFlow({ client, conversationId: upstreamConversation.id }, { hitlEnabled: false })
      await setFlow({ client, conversationId: downstreamConversationId }, { hitlEnabled: false })
    }
    return
  }

  console.info('Sending message to downstream')
  await respond({ conversationId: downstreamConversationId, userId: downstreamUserId, text: message.payload.text })
}
