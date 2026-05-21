import { GRAFANA } from '../const'
import type { Dashboard, Panel } from '../types'
import { Client, goToMainMenu, pickFromList, reply, setFlowState, setTags, showList, showMenu } from '../utils'

export const displayDashboard = async (client: Client, conversationId: string, userId: string, uid: string) => {
  let dashboard
  try {
    const { output } = await client.callAction({
      type: `${GRAFANA}:getDashboard`,
      input: { dashboardUid: uid },
    })
    dashboard = output.dashboard
  } catch {
    await showMenu(client, conversationId, userId, 'Dashboard not found.\n\nEnter the dashboard UID to view:', [
      { label: 'List dashboards', value: 'list' },
    ])
    await setTags(client, conversationId, { branch: 'get_dashboard', step: '' })
    return
  }

  if (!dashboard) {
    await showMenu(client, conversationId, userId, 'Dashboard not found.\n\nEnter the dashboard UID to view:', [
      { label: 'List dashboards', value: 'list' },
    ])
    await setTags(client, conversationId, { branch: 'get_dashboard', step: '' })
    return
  }

  const { title, panels } = dashboard
  const panelList = panels?.length ? panels.map((p: Panel) => `  - ${p.title ?? 'Untitled'}`).join('\n') : '  No panels'
  await reply(client, conversationId, userId, `Title: ${title}\n\nPanels:\n${panelList}`)
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
