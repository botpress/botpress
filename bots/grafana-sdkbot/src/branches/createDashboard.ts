import { GRAFANA } from '../const'
import type { CreateForm, ListControl } from '../types'
import { Client, goToMainMenu, getFlowState, reply, setFlowState, setTags, showMenu } from '../utils'
import { startFolderPicker } from './folderPicker'
import { startPanelCreator } from './panelCreator'

const handleOptionalStep = async (
  client: Client,
  conversationId: string,
  userId: string,
  form: CreateForm,
  input: string
) => {
  if (input === '-1') {
    await reply(client, conversationId, userId, 'Operation cancelled.')
    await goToMainMenu(client, conversationId, userId)
    return
  }
  if (input === '0') {
    await submitCreateDashboard(client, conversationId, userId, form)
    return
  }
  if (input === '1') {
    await startPanelCreator(client, conversationId, userId, 'create_dashboard')
    return
  }
  const index = Number.parseInt(input) - 2
  const field = OPTIONAL_FIELDS[index]
  if (!field || Number.isNaN(index)) {
    await showMenu(client, conversationId, userId, `Invalid option.\n\n${buildOptionalMenu(form)}`, DASHBOARD_CONTROLS)
    return
  }
  if (field.key === 'folderUid') {
    await startFolderPicker(client, conversationId, userId, 'create_dashboard')
    return
  }
  await reply(client, conversationId, userId, `Enter value for "${field.label}":`)
  await setTags(client, conversationId, { branch: 'create_dashboard', step: `set_${field.key}` })
}

const OPTIONAL_FIELDS: { key: keyof CreateForm; label: string }[] = [
  { key: 'tags', label: 'Tags (comma-separated)' },
  { key: 'timezone', label: 'Timezone' },
  { key: 'editable', label: 'Editable (yes/no)' },
  { key: 'graphTooltip', label: 'Graph tooltip (0, 1 or 2)' },
  { key: 'timeFrom', label: 'Time range from (e.g. now-6h)' },
  { key: 'timeTo', label: 'Time range to (e.g. now)' },
  { key: 'refresh', label: 'Refresh interval (e.g. 30s)' },
  { key: 'folderUid', label: 'Folder UID' },
]

const formatValue = (form: CreateForm, key: keyof CreateForm): string => {
  const val = form[key]
  if (val === undefined) return '(not set)'
  if (Array.isArray(val)) return val.every((v) => typeof v === 'string') ? val.join(', ') : `${val.length} items`
  return String(val)
}

const DASHBOARD_CONTROLS: ListControl[] = [
  { label: 'Create dashboard', value: '0' },
  { label: 'Cancel', value: '-1' },
]

export const buildOptionalMenu = (form: CreateForm): string => {
  const panelCount = form.panels?.length ?? 0
  const panelLine = `1 → Add panel (${panelCount} added)`
  const fields = OPTIONAL_FIELDS.map((f, i) => `${i + 2} → ${f.label}: ${formatValue(form, f.key)}`).join('\n')
  return `Optional fields (pick a number to set):\n${panelLine}\n${fields}`
}

const parseFieldValue = (key: keyof CreateForm, input: string): CreateForm[typeof key] => {
  if (key === 'tags') {
    return input
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
  }
  if (key === 'editable') return input.toLowerCase() === 'yes'
  if (key === 'graphTooltip') return Number.parseInt(input)
  return input
}

export const startCreateDashboard = async (client: Client, conversationId: string, userId: string) => {
  await setFlowState(client, conversationId, { createForm: {} })
  await reply(client, conversationId, userId, 'Enter the dashboard Title:')
  await setTags(client, conversationId, { branch: 'create_dashboard', step: 'title' })
}

export const handleCreateDashboard = async (
  client: Client,
  conversationId: string,
  userId: string,
  step: string,
  input: string
) => {
  const state = await getFlowState(client, conversationId)
  const form = state.createForm ?? {}

  if (step === 'title') {
    const updatedForm = { ...form, title: input, uid: input.toLowerCase().replaceAll(/\s+/g, '-') }
    await setFlowState(client, conversationId, { createForm: updatedForm })
    await showMenu(client, conversationId, userId, buildOptionalMenu(updatedForm), DASHBOARD_CONTROLS)
    await setTags(client, conversationId, { branch: 'create_dashboard', step: 'optional' })
    return
  }

  if (step === 'optional') {
    return handleOptionalStep(client, conversationId, userId, form, input)
  }

  if (step.startsWith('set_')) {
    const key = step.replace('set_', '') as keyof CreateForm
    const updatedForm = { ...form, [key]: parseFieldValue(key, input) }
    await setFlowState(client, conversationId, { createForm: updatedForm })
    await showMenu(client, conversationId, userId, buildOptionalMenu(updatedForm), DASHBOARD_CONTROLS)
    await setTags(client, conversationId, { branch: 'create_dashboard', step: 'optional' })
  }
}

export const applyFolderUid = async (client: Client, conversationId: string, userId: string, uid: string) => {
  const state = await getFlowState(client, conversationId)
  const form = { ...state.createForm, folderUid: uid } as CreateForm
  await setFlowState(client, conversationId, { createForm: form })
  await showMenu(client, conversationId, userId, buildOptionalMenu(form), DASHBOARD_CONTROLS)
  await setTags(client, conversationId, { branch: 'create_dashboard', step: 'optional' })
}

export const applyPanel = async (client: Client, conversationId: string, userId: string, panel: object | null) => {
  const state = await getFlowState(client, conversationId)
  const form = state.createForm as CreateForm
  if (panel) {
    const updatedForm = { ...form, panels: [...(form.panels ?? []), panel] }
    await setFlowState(client, conversationId, { createForm: updatedForm })
    await showMenu(
      client,
      conversationId,
      userId,
      `Panel added.\n\n${buildOptionalMenu(updatedForm)}`,
      DASHBOARD_CONTROLS
    )
  } else {
    await showMenu(client, conversationId, userId, buildOptionalMenu(form), DASHBOARD_CONTROLS)
  }
  await setTags(client, conversationId, { branch: 'create_dashboard', step: 'optional' })
}

const submitCreateDashboard = async (client: Client, conversationId: string, userId: string, _form: CreateForm) => {
  const state = await getFlowState(client, conversationId)
  const form = state.createForm as CreateForm

  const { output } = await client.callAction({
    type: `${GRAFANA}:createDashboard`,
    input: {
      uid: form.uid!,
      title: form.title!,
      ...(form.panels?.length && { panels: form.panels as any }),
      ...(form.tags && { tags: form.tags }),
      ...(form.timezone && { timezone: form.timezone }),
      ...(form.editable !== undefined && { editable: form.editable }),
      ...(form.graphTooltip !== undefined && { graphTooltip: form.graphTooltip }),
      ...(form.timeFrom && form.timeTo && { time: { from: form.timeFrom, to: form.timeTo } }),
      ...(form.refresh && { refresh: form.refresh }),
      ...(form.folderUid && { folderUid: form.folderUid }),
    },
  })

  const { success, error } = output

  if (success) {
    await reply(client, conversationId, userId, `Dashboard "${form.title}" created successfully.`)
  } else {
    await reply(client, conversationId, userId, `Failed to create dashboard: ${error ?? 'Unknown error.'}`)
  }

  await goToMainMenu(client, conversationId, userId)
}
