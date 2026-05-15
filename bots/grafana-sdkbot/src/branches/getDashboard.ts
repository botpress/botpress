import { GRAFANA } from '../const'
import type { Dashboard, DashboardData } from '../types'
import { Client, goToMainMenu, pickFromList, reply, setFlowState, setTags, showList, showMenu } from '../utils'

export const displayDashboard = async (client: Client, conversationId: string, userId: string, uid: string) => {
  const { output } = await client.callAction({
    type: `${GRAFANA}:getDashboard`,
    input: { dashboardUid: uid },
  })
  const { success, data } = output as { success: boolean; data?: DashboardData }

  if (!success || !data?.dashboard) {
    await showMenu(client, conversationId, userId, 'Dashboard not found.\n\nEnter the dashboard UID to view:', [
      { label: 'List dashboards', value: 'list' },
    ])
    await setTags(client, conversationId, { branch: 'get_dashboard', step: '' })
    return
  } else {
    const { title, panels } = data.dashboard
    const panelList = panels?.length ? panels.map((p) => `  - ${p.title ?? 'Untitled'}`).join('\n') : '  No panels'
    await reply(client, conversationId, userId, `Title: ${title}\n\nPanels:\n${panelList}`)
  }

  await goToMainMenu(client, conversationId, userId)
}

export const handleGetDashboard = async (client: Client, conversationId: string, userId: string, input: string) => {
  if (input.toLowerCase() === 'list') {
    const { output } = await client.callAction({ type: `${GRAFANA}:listDashboards`, input: {} })
    const { dashboards } = output as { dashboards?: Dashboard[] }

    if (!dashboards?.length) {
      await reply(client, conversationId, userId, 'No dashboards.')
      await goToMainMenu(client, conversationId, userId)
      return
    }

    await setFlowState(client, conversationId, { dashboards })
    await showList(
      client,
      conversationId,
      userId,
      'Dashboards:',
      dashboards.map((d) => `${d.title} (${d.name})`)
    )
    await setTags(client, conversationId, { branch: 'get_dashboard_select' })
    return
  }

  await displayDashboard(client, conversationId, userId, input)
}

export const handleGetDashboardSelect = async (
  client: Client,
  conversationId: string,
  userId: string,
  input: string
) => {
  const { state } = await client.getState({ type: 'conversation', id: conversationId, name: 'dashboardFlow' })
  const dashboards = (state.payload.dashboards ?? []) as Dashboard[]
  const dashboard = pickFromList(dashboards, input)
  if (!dashboard) {
    await showList(
      client,
      conversationId,
      userId,
      'Invalid choice. Pick a number:',
      dashboards.map((d) => `${d.title} (${d.name})`)
    )
    return
  }

  await displayDashboard(client, conversationId, userId, dashboard.name)
}
