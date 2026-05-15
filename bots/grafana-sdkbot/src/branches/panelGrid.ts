import type { PanelForm } from '../types'
import { Client, getFlowState, reply, setFlowState, setTags, showMenu } from '../utils'

const GRID_FIELDS: { key: keyof PanelForm; label: string }[] = [
  { key: 'gridPosH', label: 'Height (h)' },
  { key: 'gridPosW', label: 'Width (w)' },
  { key: 'gridPosX', label: 'X position' },
  { key: 'gridPosY', label: 'Y position' },
]

const GRID_CONTROLS = [{ label: 'Done', value: '0' }]

const buildGridMenu = (form: PanelForm): string => {
  const fields = GRID_FIELDS.map((f, i) => `${i + 1} → ${f.label}: ${form[f.key] ?? '(not set)'}`).join('\n')
  return `Custom display:\n${fields}`
}

export const startPanelGrid = async (client: Client, conversationId: string, userId: string) => {
  const state = await getFlowState(client, conversationId)
  const form = (state.panelForm ?? {}) as unknown as PanelForm
  await showMenu(client, conversationId, userId, buildGridMenu(form), GRID_CONTROLS)
  await setTags(client, conversationId, { branch: 'panel_grid', step: 'menu' })
}

export const handlePanelGrid = async (
  client: Client,
  conversationId: string,
  userId: string,
  step: string,
  input: string,
  onDone: () => Promise<void>
) => {
  const state = await getFlowState(client, conversationId)
  const form = (state.panelForm ?? {}) as unknown as PanelForm

  if (step === 'menu') {
    if (input === '0') {
      await onDone()
      return
    }
    const index = Number.parseInt(input) - 1
    const field = GRID_FIELDS[index]
    if (!field || Number.isNaN(index)) {
      await showMenu(client, conversationId, userId, `Invalid option.\n\n${buildGridMenu(form)}`, GRID_CONTROLS)
      return
    }
    await reply(client, conversationId, userId, `Enter ${field.label}:`)
    await setTags(client, conversationId, { branch: 'panel_grid', step: `set_${field.key}` })
    return
  }

  if (step.startsWith('set_')) {
    const key = step.replace('set_', '') as keyof PanelForm
    const updatedForm = { ...form, [key]: Number.parseInt(input) }
    await setFlowState(client, conversationId, { panelForm: updatedForm })
    await showMenu(client, conversationId, userId, buildGridMenu(updatedForm), GRID_CONTROLS)
    await setTags(client, conversationId, { branch: 'panel_grid', step: 'menu' })
  }
}
