import { GRAFANA } from '../const'
import type { Dashboard } from '../types'
import { Client, MAIN_MENU, reply, setTags, showList, showMenu } from '../utils'
import { startCreateAlertRule } from './createAlertRule'
import { startCreateDashboard } from './createDashboard'
import { startManageAlertRules } from './manageAlertRules'
import { startNotifications } from './notifications'

export const handleMain = async (client: Client, conversationId: string, userId: string, input: string) => {
  if (input === '1') {
    const { output } = await client.callAction({ type: `${GRAFANA}:listDashboards`, input: {} })
    const { dashboards } = output as { dashboards?: Dashboard[] }

    if (!dashboards?.length) {
      await reply(client, conversationId, userId, 'No dashboards found.')
      await reply(client, conversationId, userId, MAIN_MENU)
      return
    }

    await showList(
      client,
      conversationId,
      userId,
      'Dashboards:',
      dashboards.map((d) => `${d.title} (${d.name})`)
    )
    await reply(client, conversationId, userId, MAIN_MENU)
    return
  }

  if (input === '2') {
    await showMenu(client, conversationId, userId, 'Enter the dashboard UID to view:', [
      { label: 'List dashboards', value: 'list' },
    ])
    await setTags(client, conversationId, { branch: 'get_dashboard' })
    return
  }

  if (input === '3') {
    await startCreateDashboard(client, conversationId, userId)
    return
  }

  if (input === '4') {
    await showMenu(client, conversationId, userId, 'Enter the dashboard UID to edit:', [
      { label: 'List dashboards', value: 'list' },
    ])
    await setTags(client, conversationId, { branch: 'edit_dashboard_uid' })
    return
  }

  if (input === '5') {
    await startCreateAlertRule(client, conversationId, userId)
    return
  }

  if (input === '6') {
    await startManageAlertRules(client, conversationId, userId)
    return
  }

  if (input === '7') {
    await startNotifications(client, conversationId, userId)
    return
  }

  await reply(client, conversationId, userId, 'Invalid option.')
  await reply(client, conversationId, userId, MAIN_MENU)
}
