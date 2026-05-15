import { GRAFANA } from '../const'
import type { Dashboard, EditDashboardForm, PanelForm } from '../types'
import {
  Client,
  getFlowState,
  goToMainMenu,
  pickFromList,
  reply,
  setFlowState,
  setTags,
  showList,
  showMenu,
} from '../utils'
import { startFolderPicker } from './folderPicker'
import {
  buildPanelOptionalMenu,
  panelFormToPayload,
  getOptionalItems,
  FieldItem,
  PANEL_SAVE_CONTROLS,
} from './panelCreator'
import { startPanelDatasource } from './panelDatasource'
import { startPanelGrid } from './panelGrid'

// ─── Dashboard settings menu ──────────────────────────────────

type EditField = { key: keyof EditDashboardForm; label: string }

const EDIT_FIELDS: EditField[] = [
  { key: 'title', label: 'Title' },
  { key: 'tags', label: 'Tags (comma-separated)' },
  { key: 'timezone', label: 'Timezone' },
  { key: 'timeFrom', label: 'Time from (e.g. now-6h)' },
  { key: 'timeTo', label: 'Time to (e.g. now)' },
  { key: 'refresh', label: 'Refresh interval (e.g. 30s)' },
  { key: 'folderUid', label: 'Folder UID' },
]

const formatEditValue = (form: EditDashboardForm, key: keyof EditDashboardForm): string => {
  const val = form[key]
  if (val === undefined) return '(not set)'
  if (Array.isArray(val)) return val.join(', ')
  return String(val)
}

const SETTINGS_CONTROLS = [
  { label: 'Save', value: '0' },
  { label: 'Back', value: '-1' },
]

const buildSettingsMenu = (form: EditDashboardForm): string => {
  const fields = EDIT_FIELDS.map((f, i) => i + 1 + ' → ' + f.label + ': ' + formatEditValue(form, f.key)).join('\n')
  return 'Dashboard settings:\n' + fields
}

const buildEditMenu = async (client: Client, conversationId: string, userId: string, title: string): Promise<void> => {
  await showMenu(
    client,
    conversationId,
    userId,
    'Editing: "' + title + '"\n\n1 → Dashboard settings\n2 → Edit a panel',
    [{ label: 'Done', value: '-1' }]
  )
}

// ─── Panel list from dashboard JSON ──────────────────────────

type RawPanel = {
  id?: number
  type?: string
  title?: string
  gridPos?: any
  datasource?: any
  targets?: any[]
  options?: any
  description?: string
}

const dashboardPanels = (dashboardJson: any): RawPanel[] => dashboardJson?.panels ?? []

const panelLabels = (panels: RawPanel[]): string[] =>
  panels.map((p) => `${p.title ?? '(untitled)'} (id: ${p.id}, ${p.type ?? '?'})`)

const rawPanelToForm = (p: RawPanel): PanelForm => ({
  type: p.type === 'text' || p.type === 'timeseries' ? p.type : 'timeseries',
  title: p.title,
  id: p.id,
  description: p.description,
  gridPosH: p.gridPos?.h,
  gridPosW: p.gridPos?.w,
  gridPosX: p.gridPos?.x,
  gridPosY: p.gridPos?.y,
  ...(p.type === 'text'
    ? { content: p.options?.content, mode: p.options?.mode }
    : { datasourceUid: p.datasource?.uid, query: p.targets?.[0]?.expr }),
})

// ─── Action submissions ───────────────────────────────────────

const submitEditDashboard = async (
  client: Client,
  conversationId: string,
  userId: string,
  form: EditDashboardForm,
  uid: string
) => {
  const { output } = await client.callAction({
    type: `${GRAFANA}:editDashboard`,
    input: {
      dashboardUid: uid,
      ...(form.title && { title: form.title }),
      ...(form.tags && { tags: form.tags }),
      ...(form.timezone && { timezone: form.timezone }),
      ...(form.timeFrom && form.timeTo && { time: { from: form.timeFrom, to: form.timeTo } }),
      ...(form.refresh && { refresh: form.refresh }),
      ...(form.folderUid && { folderUid: form.folderUid }),
    } as any,
  })
  const { success, error } = output
  if (success) {
    await reply(client, conversationId, userId, 'Dashboard settings saved.')
  } else {
    await reply(client, conversationId, userId, 'Failed to save: ' + (error ?? 'Unknown error.'))
  }
}

const submitEditPanel = async (
  client: Client,
  conversationId: string,
  userId: string,
  form: PanelForm,
  uid: string
) => {
  const { output } = await client.callAction({
    type: `${GRAFANA}:editDashboardPanel`,
    input: {
      dashboardUid: uid,
      panelId: form.id!,
      panel: panelFormToPayload(form) as any,
    },
  })
  const { success, error } = output
  if (success) {
    await reply(client, conversationId, userId, 'Panel saved.')
  } else {
    await reply(client, conversationId, userId, 'Failed to save panel: ' + (error ?? 'Unknown error.'))
  }
}

// ─── Step handlers ────────────────────────────────────────────

const handleEditMenu = async (
  client: Client,
  conversationId: string,
  userId: string,
  input: string,
  state: Awaited<ReturnType<typeof getFlowState>>
) => {
  const title = state.selectedDashboard?.title ?? ''
  if (input === '-1') {
    await goToMainMenu(client, conversationId, userId)
    return
  }
  if (input === '1') {
    await setFlowState(client, conversationId, { editDashboardForm: {} })
    await showMenu(client, conversationId, userId, buildSettingsMenu({}), SETTINGS_CONTROLS)
    await setTags(client, conversationId, { branch: 'edit_dashboard', step: 'settings_menu' })
    return
  }
  if (input === '2') {
    const panels = dashboardPanels(state.dashboardJson)
    if (!panels.length) {
      await reply(client, conversationId, userId, 'No panels found in this dashboard.')
      return
    }
    await showList(client, conversationId, userId, 'Select a panel to edit:', panelLabels(panels), [
      { label: 'Back', value: '-1' },
    ])
    await setTags(client, conversationId, { branch: 'edit_dashboard', step: 'panel_select' })
    return
  }
  await reply(client, conversationId, userId, 'Invalid option.')
  await buildEditMenu(client, conversationId, userId, title)
}

const handleSettingsMenu = async (
  client: Client,
  conversationId: string,
  userId: string,
  form: EditDashboardForm,
  uid: string,
  dashboardTitle: string,
  input: string
) => {
  if (input === '-1') {
    await buildEditMenu(client, conversationId, userId, dashboardTitle)
    await setTags(client, conversationId, { branch: 'edit_dashboard', step: 'menu' })
    return
  }
  if (input === '0') {
    await submitEditDashboard(client, conversationId, userId, form, uid)
    await buildEditMenu(client, conversationId, userId, form.title ?? dashboardTitle)
    await setTags(client, conversationId, { branch: 'edit_dashboard', step: 'menu' })
    return
  }
  const index = Number.parseInt(input) - 1
  const field = EDIT_FIELDS[index]
  if (!field || Number.isNaN(index)) {
    await showMenu(client, conversationId, userId, 'Invalid option.\n\n' + buildSettingsMenu(form), SETTINGS_CONTROLS)
    return
  }
  if (field.key === 'folderUid') {
    await startFolderPicker(client, conversationId, userId, 'edit_dashboard')
    return
  }
  await reply(client, conversationId, userId, 'Enter value for "' + field.label + '":')
  await setTags(client, conversationId, { branch: 'edit_dashboard', step: 'settings_set_' + field.key })
}

const handlePanelSelect = async (
  client: Client,
  conversationId: string,
  userId: string,
  input: string,
  state: Awaited<ReturnType<typeof getFlowState>>
) => {
  const dashboardTitle = state.selectedDashboard?.title ?? ''
  if (input === '-1') {
    await buildEditMenu(client, conversationId, userId, dashboardTitle)
    await setTags(client, conversationId, { branch: 'edit_dashboard', step: 'menu' })
    return
  }
  const panels = dashboardPanels(state.dashboardJson)
  const panel = pickFromList(panels, input)
  if (!panel) {
    await showList(client, conversationId, userId, 'Invalid selection. Select a panel to edit:', panelLabels(panels), [
      { label: 'Back', value: '-1' },
    ])
    return
  }
  const form = rawPanelToForm(panel)
  await setFlowState(client, conversationId, { panelForm: form, callerBranch: 'edit_dashboard' })
  await showMenu(client, conversationId, userId, buildPanelOptionalMenu(form), PANEL_SAVE_CONTROLS)
  await setTags(client, conversationId, { branch: 'edit_dashboard', step: 'panel_menu' })
}

type PanelMenuCtx = { uid: string; dashboardTitle: string; dashboardJson: any }

const handlePanelMenu = async (
  client: Client,
  conversationId: string,
  userId: string,
  form: PanelForm,
  ctx: PanelMenuCtx,
  input: string
) => {
  const { uid, dashboardTitle, dashboardJson } = ctx
  if (input === '-1') {
    await showList(
      client,
      conversationId,
      userId,
      'Select a panel to edit:',
      panelLabels(dashboardPanels(dashboardJson)),
      [{ label: 'Back', value: '-1' }]
    )
    await setTags(client, conversationId, { branch: 'edit_dashboard', step: 'panel_select' })
    return
  }
  if (input === '0') {
    await submitEditPanel(client, conversationId, userId, form, uid)
    await buildEditMenu(client, conversationId, userId, dashboardTitle)
    await setTags(client, conversationId, { branch: 'edit_dashboard', step: 'menu' })
    return
  }
  const items = getOptionalItems(form.type!)
  const index = Number.parseInt(input) - 1
  const item = items[index]
  if (!item || Number.isNaN(index)) {
    await showMenu(
      client,
      conversationId,
      userId,
      'Invalid option.\n\n' + buildPanelOptionalMenu(form),
      PANEL_SAVE_CONTROLS
    )
    return
  }
  if (item.kind === 'subroutine') {
    if (item.id === 'grid') await startPanelGrid(client, conversationId, userId)
    else await startPanelDatasource(client, conversationId, userId)
    return
  }
  await reply(client, conversationId, userId, 'Enter value for "' + item.label + '":')
  await setTags(client, conversationId, { branch: 'edit_dashboard', step: 'panel_set_' + item.key })
}

// ─── Exported callbacks ───────────────────────────────────────

export const resumeEditPanel = async (client: Client, conversationId: string, userId: string) => {
  const state = await getFlowState(client, conversationId)
  const form = (state.panelForm ?? {}) as unknown as PanelForm
  await showMenu(client, conversationId, userId, buildPanelOptionalMenu(form), PANEL_SAVE_CONTROLS)
  await setTags(client, conversationId, { branch: 'edit_dashboard', step: 'panel_menu' })
}

export const applyEditFolderUid = async (client: Client, conversationId: string, userId: string, uid: string) => {
  const state = await getFlowState(client, conversationId)
  const form = { ...state.editDashboardForm, folderUid: uid } as EditDashboardForm
  await setFlowState(client, conversationId, { editDashboardForm: form })
  await showMenu(client, conversationId, userId, buildSettingsMenu(form), SETTINGS_CONTROLS)
  await setTags(client, conversationId, { branch: 'edit_dashboard', step: 'settings_menu' })
}

// ─── Entry point ──────────────────────────────────────────────

const loadAndEnterEditDashboard = async (client: Client, conversationId: string, userId: string, uid: string) => {
  const { output } = await client.callAction({
    type: `${GRAFANA}:getDashboard`,
    input: { dashboardUid: uid },
  })
  const { success, data } = output as { success: boolean; data?: { dashboard?: any } }
  if (!success || !data?.dashboard) {
    await showMenu(client, conversationId, userId, 'Dashboard not found.\n\nEnter the dashboard UID to edit:', [
      { label: 'List dashboards', value: 'list' },
    ])
    await setTags(client, conversationId, { branch: 'edit_dashboard_uid', step: '' })
    return
  }
  const dashboard = data.dashboard
  await setFlowState(client, conversationId, {
    selectedDashboard: { uid: dashboard.uid ?? uid, name: dashboard.uid ?? uid, title: dashboard.title ?? uid },
    dashboardJson: dashboard,
  })
  await buildEditMenu(client, conversationId, userId, dashboard.title ?? uid)
  await setTags(client, conversationId, { branch: 'edit_dashboard', step: 'menu' })
}

export const handleEditDashboardUidInput = async (
  client: Client,
  conversationId: string,
  userId: string,
  input: string
) => {
  if (input.toLowerCase() === 'list') {
    const { output } = await client.callAction({ type: `${GRAFANA}:listDashboards`, input: {} })
    const { dashboards } = output as { dashboards?: Dashboard[] }
    if (!dashboards?.length) {
      await reply(client, conversationId, userId, 'No dashboards found.')
      await goToMainMenu(client, conversationId, userId)
      return
    }
    await setFlowState(client, conversationId, { dashboards })
    await showList(
      client,
      conversationId,
      userId,
      'Dashboards:',
      dashboards.map((d) => d.title + ' (' + d.name + ')')
    )
    await setTags(client, conversationId, { branch: 'edit_dashboard_uid_select' })
    return
  }
  await loadAndEnterEditDashboard(client, conversationId, userId, input)
}

export const handleEditDashboardUidSelect = async (
  client: Client,
  conversationId: string,
  userId: string,
  input: string
) => {
  const state = await getFlowState(client, conversationId)
  const dashboards = state.dashboards ?? []
  const dashboard = pickFromList(dashboards, input)
  if (!dashboard) {
    await showList(
      client,
      conversationId,
      userId,
      'Invalid choice. Pick a number:',
      dashboards.map((d) => d.title + ' (' + d.name + ')')
    )
    return
  }
  await loadAndEnterEditDashboard(client, conversationId, userId, dashboard.name)
}

export const handleEditDashboard = async (
  client: Client,
  conversationId: string,
  userId: string,
  step: string,
  input: string
) => {
  const state = await getFlowState(client, conversationId)
  const uid = state.selectedDashboard?.uid ?? ''
  const dashboardTitle = state.selectedDashboard?.title ?? uid
  const editForm: EditDashboardForm = state.editDashboardForm ?? {}
  const panelForm = (state.panelForm ?? {}) as unknown as PanelForm

  if (step === 'menu') return handleEditMenu(client, conversationId, userId, input, state)
  if (step === 'settings_menu') {
    return handleSettingsMenu(client, conversationId, userId, editForm, uid, dashboardTitle, input)
  }

  if (step.startsWith('settings_set_')) {
    const key = step.replace('settings_set_', '') as keyof EditDashboardForm
    const value =
      key === 'tags'
        ? input
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : input
    const updatedForm = { ...editForm, [key]: value }
    await setFlowState(client, conversationId, { editDashboardForm: updatedForm })
    await showMenu(client, conversationId, userId, buildSettingsMenu(updatedForm), SETTINGS_CONTROLS)
    await setTags(client, conversationId, { branch: 'edit_dashboard', step: 'settings_menu' })
    return
  }

  if (step === 'panel_select') return handlePanelSelect(client, conversationId, userId, input, state)
  if (step === 'panel_menu') {
    return handlePanelMenu(
      client,
      conversationId,
      userId,
      panelForm,
      { uid, dashboardTitle, dashboardJson: state.dashboardJson },
      input
    )
  }

  if (step.startsWith('panel_set_')) {
    const key = step.replace('panel_set_', '') as keyof PanelForm
    const fieldItem = getOptionalItems(panelForm.type!).find(
      (item): item is FieldItem => item.kind === 'field' && item.key === key
    )
    const value = fieldItem?.numeric ? Number.parseInt(input) : input
    const updatedForm = { ...panelForm, [key]: value }
    await setFlowState(client, conversationId, { panelForm: updatedForm })
    await showMenu(client, conversationId, userId, buildPanelOptionalMenu(updatedForm), PANEL_SAVE_CONTROLS)
    await setTags(client, conversationId, { branch: 'edit_dashboard', step: 'panel_menu' })
  }
}
