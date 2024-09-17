import { mkRespond } from 'src/api-utils'
import { getOrCreateFlow, setFlow } from '../flow-state'
import { Client, ClientOutputs, MessageHandler } from '../types'
import * as bp from '.botpress'

type User = ClientOutputs['getUser']['user']
type StartHitlInput = bp.zendesk.actions.startHitl.input.Input
type MessageHistoryElement = NonNullable<StartHitlInput['messageHistory']>[number]

class UserLinker {
  public constructor(private _users: Record<string, User>, private _client: Client) {}

  public async linkUsers(upstreamUserId: string): Promise<string> {
    let upstreamUser = this._users[upstreamUserId]
    if (!upstreamUser) {
      const { user: fetchedUser } = await this._client.getUser({ id: upstreamUserId })
      this._users[upstreamUserId] = fetchedUser
      upstreamUser = fetchedUser
    }

    if (upstreamUser.tags.downstream) {
      return upstreamUser.tags.downstream
    }

    const downstreamUserId = await this._linkUser(upstreamUser)
    return downstreamUserId
  }

  private async _linkUser(upstreamUser: User): Promise<string> {
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

    await this._client.updateUser({
      id: upstreamUser.id,
      tags: {
        downstream: downstreamUserId,
      },
    })

    await this._client.updateUser({
      id: downstreamUserId,
      tags: {
        upstream: upstreamUser.id,
      },
    })

    return downstreamUserId
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
      const downstreamUserId = await users.linkUsers(upstreamUser.id)

      const { messages: upstreamMessages } = await client.listMessages({
        conversationId: upstreamConversation.id,
      })

      const messageHistory: MessageHistoryElement[] = []
      for (const message of upstreamMessages) {
        const isBot = message.userId === props.ctx.botId // TODO: use the bot user id instead of bot id
        messageHistory.push({
          source: isBot ? { type: 'bot' } : { type: 'user', userId: message.userId },
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
      await respond({ conversationId: upstreamConversation.id, text: 'Transfering you to a human agent...' })
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

  console.info('Sending message to downstream')
  await respond({ conversationId: downstreamConversationId, userId: downstreamUserId, text: message.payload.text })
}
