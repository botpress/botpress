import { Message as ApiMessage, ClientOutputs, isApiError } from '@botpress/client'
import * as errors from '../../gen/errors'
import * as signals from '../../gen/signals'
import * as types from '../types'
import * as model from './model'
import { Client } from '.botpress'

type User = Awaited<ReturnType<types.Operations['getUser']>>['body']['user']
type Conversation = Awaited<ReturnType<types.Operations['getConversation']>>['body']['conversation']
type Message = Awaited<ReturnType<types.Operations['listMessages']>>['body']['messages'][number]
type Participant = Awaited<ReturnType<types.Operations['listParticipants']>>['body']['participants'][number]

type InitialEvent = signals.Types['initialized']

export const initialize: types.Operations['initializeConversation'] = async (props, req) => {
  const conversationId = req.query.conversationId
  let userKey = req.headers['x-user-key']

  let user: User
  if (userKey) {
    const parsedKey = props.auth.parseKey(userKey)
    const userId = parsedKey.id
    user = await props.client.getUser({ id: userId }).then((res) => res.user)
  } else {
    user = await props.client.createUser({ tags: {} }).then((res) => res.user)
    userKey = props.auth.generateKey({ id: user.id })

    if (conversationId) {
      throw new errors.InvalidPayloadError('You cannot initialize an already existing conversation without a user.')
    }
  }

  if (!user) {
    throw new errors.InternalError('User could not be resolved from authorization or be created')
  }

  let conversation: Conversation | undefined
  let messages: Message[] = []
  let participants: Participant[] = []

  try {
    if (conversationId) {
      const conversationPromise = props.client.getConversation({ id: conversationId }).then((res) => res.conversation)
      const messagesPromise = listMessages(props.client, conversationId, 10).then((res) =>
        res.map((m) => model.mapMessage(m as types.Message))
      )
      const participantsPromise = listParticipants(props.client, conversationId, 5)

      ;[conversation, messages, participants] = await Promise.all([
        conversationPromise,
        messagesPromise,
        participantsPromise,
      ])
    } else {
      conversation = await props.client
        .createConversation({
          channel: 'channel',
          tags: {
            owner: user.id,
          },
        })
        .then((res) => res.conversation)
      if (!conversation) {
        throw new errors.InternalError('Failed to create conversation')
      }

      const { participant } = await props.client.addParticipant({ id: conversation.id, userId: user.id })
      participants = [participant]
    }
  } catch (error) {
    if (isApiError(error) && error.code === 403) {
      throw new errors.ForbiddenError("You don't have access to this conversation")
    }
    throw new errors.InternalError(conversationId ? 'Failed to fetch conversation' : 'Failed to create conversation')
  }

  const ev: InitialEvent = {
    type: 'init',
    data: { conversation, user: { ...user, userKey }, messages, participants },
  }

  const body = createSSEMessage('init', ev)
  const contentLength = Buffer.byteLength(body, 'utf-8')

  const keepAliveMessage = createSSEMessage('message', 'ping')
  const b64KeepAlive = Buffer.from(keepAliveMessage, 'utf-8').toString('base64')

  return {
    body,
    headers: {
      'Content-Type': 'text/event-stream',
      'Content-Length': `${contentLength}`,
      'Grip-Hold': 'stream',
      'Grip-Channel': `${conversation.id},${user.id}`,
      'Grip-Keep-Alive': `${b64KeepAlive}; format=base64; timeout=30;`,
    },
  }
}

function createSSEMessage(eventName: 'message' | 'init', event: any): string {
  const data = typeof event === 'string' ? event : JSON.stringify(event)
  return [`event: ${eventName}`, `data: ${data}`, '', ''].join('\n')
}

async function listMessages(client: Client, conversationId: string, pages: number = 5) {
  const messages: ApiMessage[] = []
  let nextToken: string | undefined = undefined

  for (let i = 0; i < pages; i++) {
    const result = await client.listMessages({ conversationId, nextToken })
    messages.push(...result.messages)
    nextToken = result.meta.nextToken
    if (!nextToken) break
  }

  return messages
}

async function listParticipants(client: Client, conversationId: string, pages: number = 5) {
  const participants: ClientOutputs['listParticipants']['participants'] = []
  let nextToken: string | undefined = undefined

  for (let i = 0; i < pages; i++) {
    const result = await client.listParticipants({ id: conversationId, nextToken })
    participants.push(...result.participants)
    nextToken = result.meta.nextToken
    if (!nextToken) break
  }

  return participants
}
