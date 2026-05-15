import { GRAFANA } from '../const'
import type { PanelForm } from '../types'
import { Client, getFlowState, pickFromList, reply, setFlowState, setTags, showList, showMenu } from '../utils'
import { startQueryExplorer } from './queryExplorer'

export const startPanelDatasource = async (client: Client, conversationId: string, userId: string) => {
  await listAndShowDatasources(client, conversationId, userId)
}

export const applyQuery = async (client: Client, conversationId: string, query: string) => {
  const state = await getFlowState(client, conversationId)
  await setFlowState(client, conversationId, { panelForm: { ...state.panelForm, query } as PanelForm })
}

export const resumeToQueryPrompt = async (client: Client, conversationId: string, userId: string) => {
  await showMenu(client, conversationId, userId, 'Enter a PromQL query:', [
    { label: 'Open metrics explorer', value: 'explore' },
  ])
  await setTags(client, conversationId, { branch: 'panel_datasource', step: 'set_query' })
}

const listAndShowDatasources = async (client: Client, conversationId: string, userId: string) => {
  const { output } = await client.callAction({ type: `${GRAFANA}:listDatasources`, input: {} })
  const { success, data, error } = output
  if (!success || !data) {
    await reply(client, conversationId, userId, 'Failed to list datasources: ' + (error ?? 'Unknown error.'))
    return
  }
  const prometheus = data.filter((ds) => ds.type === 'prometheus')
  if (!prometheus.length) {
    await reply(client, conversationId, userId, 'No Prometheus datasources found.')
    return
  }
  await setFlowState(client, conversationId, { datasourceList: prometheus })
  await showList(
    client,
    conversationId,
    userId,
    'Select a datasource:',
    prometheus.map((ds) => (ds.name ?? ds.uid) + ' (' + ds.uid + ')')
  )
  await setTags(client, conversationId, { branch: 'panel_datasource', step: 'select_uid' })
}

export const handlePanelDatasource = async (
  client: Client,
  conversationId: string,
  userId: string,
  step: string,
  input: string,
  onDone: () => Promise<void>
) => {
  const state = await getFlowState(client, conversationId)
  const form = (state.panelForm ?? {}) as unknown as PanelForm

  if (step === 'select_uid') {
    const ds = pickFromList(state.datasourceList ?? [], input)
    if (!ds) {
      await reply(client, conversationId, userId, 'Invalid selection.')
      return
    }
    await setFlowState(client, conversationId, { panelForm: { ...form, datasourceUid: ds.uid } })
    await resumeToQueryPrompt(client, conversationId, userId)
    return
  }

  if (step === 'set_query') {
    if (input.toLowerCase() === 'explore') {
      await startQueryExplorer(client, conversationId, userId, onDone)
      return
    }
    await setFlowState(client, conversationId, { panelForm: { ...form, query: input } })
    await onDone()
  }
}
