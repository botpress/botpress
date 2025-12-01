import { isApiError, Message as ApiMessage, ClientOutputs } from '@botpress/client'
import * as errors from '../../gen/errors'
import * as types from '../types'
import * as model from './model'
import { Client } from '.botpress'

type User = Awaited<ReturnType<types.Operations['getUser']>>['body']['user']
type Conversation = Awaited<ReturnType<types.Operations['getConversation']>>['body']['conversation']
type Message = Awaited<ReturnType<types.Operations['listMessages']>>['body']['messages'][number]
type Participant = Awaited<ReturnType<types.Operations['listParticipants']>>['body']['participants'][number]

type InitialEvent = {
  type: 'init'
  data: {
    conversation: Conversation
    user: User & { userKey: string }
    messages: Message[]
    participants: Participant[]
  }
}

export const initialize =
  (authRes: types.AuthRes): types.Operations['initializeConversation'] =>
  async (props, req) => {
    let conversationId = req.query.conversationId
    let userKey = req.headers['x-user-key']
    let user: User | undefined = 'user' in authRes ? authRes.user : undefined // if theres a user it means the participant.in authorization was successful

    // userKey is valid but user is not a participant of conversation
    if (authRes.userId && !user) {
      try {
        user = (await props.client.getUser({ id: authRes.userId })).user
      } catch (error) {
        user = (await props.client.createUser({ tags: {} })).user
      }
      conversationId = undefined // Force conversation creation
    }

    // Missing or invalid userKey
    if (!authRes.userId || !userKey) {
      try {
        user = (await props.client.createUser({ tags: {} })).user
      } catch (error) {
        throw new errors.InternalError('Failed to create user')
      }

      userKey = props.auth.generateKey({ id: user.id })
      conversationId = undefined // Force conversation creation
    }

    if (!user) {
      throw new errors.InternalError('User could not be resolved from authorization or created')
    }

    let conversation: Conversation | undefined
    let messages: Message[] = []
    let participants: Participant[] = []

    try {
      if (conversationId) {
        conversation = (await props.client.getConversation({ id: conversationId })).conversation
        messages = (await listMessages(props.client, conversationId, 10)).map((m) =>
          model.mapMessage(m as types.Message)
        )
        participants = await listParticipants(props.client, conversationId, 5)
      } else {
        conversation = (
          await props.client.createConversation({
            channel: 'channel',
            tags: {
              owner: user.id,
            },
          })
        ).conversation
        const { participant } = await props.client.addParticipant({ id: conversation.id, userId: user.id })
        participants = [participant]
      }
    } catch (error) {
      if (isApiError(error)) {
        if (error.code === 403) {
          throw new errors.ForbiddenError("You don't have access to this conversation")
        }
      }
      throw new errors.InternalError(conversationId ? 'Failed to fetch conversation' : 'Failed to create conversation')
    }

    const ev: InitialEvent = {
      type: 'init',
      data: { conversation, user: { ...user, userKey }, messages, participants },
    }

    const initialEvent = createSSEMessage('message', ev)
    const body = initialEvent
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
