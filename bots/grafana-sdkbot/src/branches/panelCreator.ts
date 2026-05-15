import type { ListControl, PanelForm } from '../types'
import { Client, getFlowState, reply, setFlowState, setTags, showMenu } from '../utils'
import { startPanelDatasource } from './panelDatasource'
import { startPanelGrid } from './panelGrid'

export type FieldItem = { kind: 'field'; key: Extract<keyof PanelForm, string>; label: string; numeric?: boolean }
type SubroutineItem = { kind: 'subroutine'; id: string; label: string; summary: (form: PanelForm) => string }
type OptionalItem = FieldItem | SubroutineItem

const gridSummary = (form: PanelForm): string => {
  const parts = [
    form.gridPosH !== undefined && `h=${form.gridPosH}`,
    form.gridPosW !== undefined && `w=${form.gridPosW}`,
    form.gridPosX !== undefined && `x=${form.gridPosX}`,
    form.gridPosY !== undefined && `y=${form.gridPosY}`,
  ].filter((p): p is string => Boolean(p))
  return parts.length ? parts.join(', ') : '(not set)'
}

const datasourceSummary = (form: PanelForm): string => {
  const parts = [form.datasourceUid && `uid=${form.datasourceUid}`, form.query && 'query set'].filter(
    (p): p is string => Boolean(p)
  )
  return parts.length ? parts.join(', ') : '(not set)'
}

const SHARED_OPTIONAL_ITEMS: OptionalItem[] = [
  { kind: 'field', key: 'title', label: 'Title' },
  { kind: 'field', key: 'description', label: 'Description' },
  { kind: 'field', key: 'id', label: 'Panel ID', numeric: true },
  { kind: 'subroutine', id: 'grid', label: 'Custom display', summary: gridSummary },
]

const TEXT_OPTIONAL_ITEMS: OptionalItem[] = [
  ...SHARED_OPTIONAL_ITEMS,
  { kind: 'field', key: 'content', label: 'Content' },
  { kind: 'field', key: 'mode', label: 'Mode (markdown/html/code)' },
]

const TIMESERIES_OPTIONAL_ITEMS: OptionalItem[] = [
  ...SHARED_OPTIONAL_ITEMS,
  { kind: 'subroutine', id: 'datasource', label: 'Select datasource', summary: datasourceSummary },
]

export const getOptionalItems = (type: string): OptionalItem[] =>
  type === 'text' ? TEXT_OPTIONAL_ITEMS : TIMESERIES_OPTIONAL_ITEMS

export const PANEL_ADD_CONTROLS: ListControl[] = [
  { label: 'Add panel', value: '0' },
  { label: 'Cancel', value: '-1' },
]
export const PANEL_SAVE_CONTROLS: ListControl[] = [
  { label: 'Save', value: '0' },
  { label: 'Back', value: '-1' },
]
export const PANEL_TYPE_CONTROLS: ListControl[] = [
  { label: 'Text', value: '1' },
  { label: 'Timeseries', value: '2' },
]

export const buildPanelOptionalMenu = (form: PanelForm): string => {
  const lines = getOptionalItems(form.type!)
    .map((item, i) => {
      const value = item.kind === 'field' ? (form[item.key] ?? '(not set)') : item.summary(form)
      return i + 1 + ' → ' + item.label + ': ' + value
    })
    .join('\n')
  return 'Optional panel fields:\n' + lines
}

export const panelFormToPayload = (form: PanelForm): object => {
  const gridPos = {
    h: form.gridPosH ?? 8,
    w: form.gridPosW ?? 24,
    ...(form.gridPosX !== undefined && { x: form.gridPosX }),
    ...(form.gridPosY !== undefined && { y: form.gridPosY }),
  }

  const shared = {
    title: form.title!,
    ...(form.description && { description: form.description }),
    ...(form.id !== undefined && { id: form.id }),
    gridPos,
  }

  if (form.type === 'text') {
    return {
      type: 'text',
      ...shared,
      ...(form.content && { content: form.content }),
      ...(form.mode && { mode: form.mode }),
    }
  }

  return {
    type: 'timeseries',
    ...shared,
    ...(form.datasourceUid && {
      datasource: { type: 'prometheus', uid: form.datasourceUid },
    }),
    ...(form.query && { targets: [{ refId: 'A', expr: form.query }] }),
  }
}

const handleOptionalStep = async (
  client: Client,
  conversationId: string,
  userId: string,
  form: PanelForm,
  input: string,
  onPanelAdded: (panel: object | null) => Promise<void>
) => {
  if (input === '-1') {
    await reply(client, conversationId, userId, 'Panel creation cancelled.')
    await onPanelAdded(null)
    return
  }
  if (input === '0') {
    await onPanelAdded(panelFormToPayload(form))
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
      `Invalid option.\n\n${buildPanelOptionalMenu(form)}`,
      PANEL_ADD_CONTROLS
    )
    return
  }
  if (item.kind === 'subroutine') {
    if (item.id === 'grid') await startPanelGrid(client, conversationId, userId)
    else await startPanelDatasource(client, conversationId, userId)
    return
  }
  await reply(client, conversationId, userId, `Enter value for "${item.label}":`)
  await setTags(client, conversationId, { branch: 'panel_creator', step: `set_${item.key}` })
}

export const resumePanelCreator = async (client: Client, conversationId: string, userId: string) => {
  const state = await getFlowState(client, conversationId)
  const form = (state.panelForm ?? {}) as unknown as PanelForm
  await showMenu(client, conversationId, userId, buildPanelOptionalMenu(form), PANEL_ADD_CONTROLS)
  await setTags(client, conversationId, { branch: 'panel_creator', step: 'optional' })
}

export const startPanelCreator = async (
  client: Client,
  conversationId: string,
  userId: string,
  returnBranch: string
) => {
  await setFlowState(client, conversationId, { panelForm: {}, callerBranch: returnBranch })
  await showMenu(client, conversationId, userId, 'Select panel type:', PANEL_TYPE_CONTROLS)
  await setTags(client, conversationId, { branch: 'panel_creator', step: 'type' })
}

export const handlePanelCreator = async (
  client: Client,
  conversationId: string,
  userId: string,
  step: string,
  input: string,
  onPanelAdded: (panel: object | null) => Promise<void>
) => {
  const state = await getFlowState(client, conversationId)
  const form = (state.panelForm ?? {}) as unknown as PanelForm

  if (step === 'type') {
    if (input !== '1' && input !== '2') {
      await showMenu(client, conversationId, userId, 'Invalid option.\n\nSelect panel type:', PANEL_TYPE_CONTROLS)
      return
    }
    const type = input === '1' ? 'text' : 'timeseries'
    await setFlowState(client, conversationId, { panelForm: { ...form, type } })
    await reply(client, conversationId, userId, 'Enter the panel title:')
    await setTags(client, conversationId, { branch: 'panel_creator', step: 'title' })
    return
  }

  if (step === 'title') {
    const updatedForm = { ...form, title: input }
    await setFlowState(client, conversationId, { panelForm: updatedForm })
    await showMenu(client, conversationId, userId, buildPanelOptionalMenu(updatedForm), PANEL_ADD_CONTROLS)
    await setTags(client, conversationId, { branch: 'panel_creator', step: 'optional' })
    return
  }

  if (step === 'optional') {
    return handleOptionalStep(client, conversationId, userId, form, input, onPanelAdded)
  }

  if (step.startsWith('set_')) {
    const key = step.replace('set_', '') as keyof PanelForm
    const fieldItem = getOptionalItems(form.type!).find(
      (item): item is FieldItem => item.kind === 'field' && item.key === key
    )
    const value = fieldItem?.numeric ? Number.parseInt(input) : input
    const updatedForm = { ...form, [key]: value }
    await setFlowState(client, conversationId, { panelForm: updatedForm })
    await showMenu(client, conversationId, userId, buildPanelOptionalMenu(updatedForm), PANEL_ADD_CONTROLS)
    await setTags(client, conversationId, { branch: 'panel_creator', step: 'optional' })
  }
}
