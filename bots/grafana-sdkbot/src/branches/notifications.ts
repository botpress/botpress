import { Client, getNotifState, goToMainMenu, setNotifState, setTags, showMenu } from '../utils'

const pad = (n: number) => n.toString().padStart(2, '0')

const formatTime = (iso: string): string => {
  const d = new Date(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear().toString().slice(-2)}`
}

export const startNotifications = async (client: Client, conversationId: string, userId: string) => {
  const notifState = await getNotifState(client, conversationId)
  const { rows } = await client.findTableRows({ table: 'alertNotificationsTable', filter: { conversationId } })

  const sorted = [...rows].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))

  const lines = sorted.map((n) => {
    const isUnread = !notifState.lastReadAt || n.receivedAt > notifState.lastReadAt
    const bullet = isUnread ? '🔔' : '🔕'
    return `${bullet} "${n.alertName}" is ${n.status} — ${formatTime(n.receivedAt)}`
  })

  const body = lines.length > 0 ? lines.join('\n') : 'No notifications yet.'
  await showMenu(client, conversationId, userId, body, [{ label: 'Back', value: '-1' }])

  await setNotifState(client, conversationId, { lastReadAt: new Date().toISOString() })
  await setTags(client, conversationId, { branch: 'notifications', step: 'list' })
}

export const handleNotifications = async (client: Client, conversationId: string, userId: string, input: string) => {
  if (input === '-1') {
    await goToMainMenu(client, conversationId, userId)
    return
  }
  await startNotifications(client, conversationId, userId)
}
