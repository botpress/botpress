import { z } from '@botpress/sdk'
import { randomUUID } from 'node:crypto'
import { dashboardFlow } from '../definitions/states/dashboardFlow'
import type { ListControl } from './types'
import * as bp from '.botpress'

export type { ListControl } from './types'

export type Client = bp.MessageHandlerProps['client']
export type Logger = bp.MessageHandlerProps['logger']

const BASE_MENU =
  'What would you like to do?\n1 → List dashboards\n2 → Get a specific dashboard\n3 → Create dashboard\n4 → Edit dashboard by UID\n5 → Create alert rule\n6 → Manage alert rules'

export const buildMainMenu = (unreadCount: number): string => {
  const notifLine = unreadCount > 0 ? `7 → 🔔 See notifications (${unreadCount} unread)` : '7 → See notifications'
  return `${BASE_MENU}\n${notifLine}`
}

export const MAIN_MENU = buildMainMenu(0)

export const reply = async (client: Client, conversationId: string, userId: string, text: string) => {
  await client.createMessage({ conversationId, userId, tags: {}, type: 'text', payload: { text } })
}

export const showList = async (
  client: Client,
  conversationId: string,
  userId: string,
  title: string,
  items: string[],
  controls?: ListControl[]
) => {
  const list = items.map((item, i) => `${i + 1} → ${item}`).join('\n')
  const text = `${title}\n${list}`
  if (controls?.length) {
    await setFlowState(client, conversationId, { activeControls: controls })
    await client.createMessage({
      conversationId,
      userId,
      tags: {},
      type: 'choice' as any,
      payload: { text, options: controls },
    })
  } else {
    await reply(client, conversationId, userId, text)
  }
}

export const showMenu = async (
  client: Client,
  conversationId: string,
  userId: string,
  text: string,
  controls: ListControl[]
) => {
  await setFlowState(client, conversationId, { activeControls: controls })
  await client.createMessage({
    conversationId,
    userId,
    tags: {},
    type: 'choice' as any,
    payload: { text, options: controls },
  })
}

export const pickFromList = <T>(items: T[], input: string): T | null => {
  const index = Number.parseInt(input) - 1
  if (Number.isNaN(index) || index < 0 || index >= items.length) return null
  return items[index] ?? null
}

export const setTags = async (client: Client, conversationId: string, tags: { branch?: string; step?: string }) => {
  await client.updateConversation({ id: conversationId, tags })
}

type FlowState = z.infer<typeof dashboardFlow.schema>

export const setFlowState = async (client: Client, conversationId: string, payload: Partial<FlowState>) => {
  const current = await getFlowState(client, conversationId)
  await client.setState({
    type: 'conversation',
    id: conversationId,
    name: 'dashboardFlow',
    payload: { ...current, ...payload },
  })
}

export const getFlowState = async (client: Client, conversationId: string): Promise<FlowState> => {
  try {
    const { state } = await client.getState({ type: 'conversation', id: conversationId, name: 'dashboardFlow' })
    return state.payload
  } catch {
    return {}
  }
}

type NotifState = { lastReadAt?: string; lastRefreshedAt?: string }

export const getNotifState = async (client: Client, conversationId: string): Promise<NotifState> => {
  try {
    const { state } = await client.getState({ type: 'conversation', id: conversationId, name: 'notifState' })
    return state.payload
  } catch {
    return {}
  }
}

export const setNotifState = async (client: Client, conversationId: string, payload: Partial<NotifState>) => {
  const current = await getNotifState(client, conversationId)
  await client.setState({
    type: 'conversation',
    id: conversationId,
    name: 'notifState',
    payload: { ...current, ...payload },
  })
}

export const goToMainMenu = async (client: Client, conversationId: string, userId: string) => {
  await client.setState({ type: 'conversation', id: conversationId, name: 'dashboardFlow', payload: {} })
  const notifState = await getNotifState(client, conversationId)
  const { rows } = await client.findTableRows({ table: 'alertNotificationsTable', filter: { conversationId } })
  const unreadCount = rows.filter((r) => !notifState.lastReadAt || r.receivedAt > notifState.lastReadAt).length
  await reply(client, conversationId, userId, buildMainMenu(unreadCount))
  await setTags(client, conversationId, { branch: 'main', step: '' })
}

export const registerAlertSubscription = async (
  client: Client,
  logger: Logger,
  conversationId: string
): Promise<string> => {
  const botpressId = randomUUID()
  await client.createTableRows({ table: 'alertSubscriptionsTable', rows: [{ botpressId, conversationId }] })
  logger.withConversationId(conversationId).info(`${conversationId} - Entry put!`)
  return botpressId
}

export const callLLM = async (
  client: Client,
  logger: Logger,
  systemPrompt: string,
  userInput: string
): Promise<Record<string, any> | null> => {
  try {
    const { output } = await client.callAction({
      type: 'anthropic:generateContent',
      input: {
        model: { id: 'claude-haiku-4-5-20251001' },
        systemPrompt,
        messages: [{ role: 'user', content: userInput }],
        responseFormat: 'json_object',
        maxTokens: 128,
        temperature: 0,
      },
    })
    const raw = (output.choices[0]!.content as string).replaceAll(/^```(?:json)?\s*|\s*```$/g, '').trim()
    return JSON.parse(raw)
  } catch (err) {
    logger.error(`LLM call failed: ${err}`)
    return null
  }
}
