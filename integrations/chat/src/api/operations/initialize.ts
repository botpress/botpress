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

  let userId: string | undefined
  if (userKey) {
    const parsedKey = props.auth.parseKey(userKey)
    userId = parsedKey.id
  }

  const initializeResponse = await props.client.initializeIncomingMessage({ conversationId, userId })
  const { conversation, user } = initializeResponse

  if (!userKey) {
    userKey = props.auth.generateKey({ id: user.id })
  }

  let messagesPromise: Promise<Message[]> = Promise.resolve([])
  if (userId && conversationId) {
    messagesPromise = listMessages(props.client, conversation.id, 10).then((res) =>
      res.map((m) => model.mapMessage(m as types.Message))
    )
  }

  let participantsPromise: Promise<Participant[]> = Promise.resolve([user])

  if (!conversationId) {
    participantsPromise = listParticipants(props.client, conversation.id, 10)
  }
  const [messages, participants] = await Promise.all([messagesPromise, participantsPromise])

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
