import { GRAFANA } from '../const'
import type { ExplorerState, PanelForm } from '../types'
import { Client, getFlowState, pickFromList, reply, setFlowState, setTags, showList } from '../utils'

const getDatasourceUid = (state: Awaited<ReturnType<typeof getFlowState>>): string =>
  state.panelForm?.datasourceUid ?? ''

const buildQuery = (metric: string, params: { label: string; value: string }[]): string => {
  if (!params.length) return metric
  const paramStr = params.map((p) => `${p.label}="${p.value}"`).join(', ')
  return `${metric}{${paramStr}}`
}

const showLabelNamesList = async (client: Client, conversationId: string, userId: string, explorer: ExplorerState) => {
  const metric = explorer.metric ?? ''
  const params = explorer.currentParams ?? []
  const query = buildQuery(metric, params)
  const last = params.at(-1)
  const backLabel = last ? `Remove ${last.label}="${last.value}"` : 'Back to metrics'
  await showList(client, conversationId, userId, `Query: ${query}\n\nLabel names:`, explorer.labelNamesList ?? [], [
    { label: 'Confirm query', value: '0' },
    { label: backLabel, value: '-1' },
  ])
  await setTags(client, conversationId, { branch: 'query_explorer', step: 'label_names_list' })
}

export const startQueryExplorer = async (
  client: Client,
  conversationId: string,
  userId: string,
  onError: () => Promise<void>
) => {
  const state = await getFlowState(client, conversationId)
  const datasourceUid = getDatasourceUid(state)
  let metricNames
  try {
    const { output } = await client.callAction({ type: `${GRAFANA}:listMetricNames`, input: { datasourceUid } })
    metricNames = output.metricNames
  } catch (err) {
    await reply(
      client,
      conversationId,
      userId,
      `Cannot explore metrics: ${err instanceof Error ? err.message : String(err)}. Going back to panel options.`
    )
    await setFlowState(client, conversationId, {
      panelForm: { ...state.panelForm, datasourceUid: undefined } as PanelForm,
    })
    await onError()
    return
  }
  if (!metricNames?.length) {
    await reply(client, conversationId, userId, 'Cannot explore metrics: invalid or empty datasource. Going back to panel options.')
    await setFlowState(client, conversationId, {
      panelForm: { ...state.panelForm, datasourceUid: undefined } as PanelForm,
    })
    await onError()
    return
  }
  await setFlowState(client, conversationId, { explorerState: { metricsList: metricNames, currentParams: [] } })
  await showList(client, conversationId, userId, 'Metrics:', metricNames, [{ label: 'Back', value: '-1' }])
  await setTags(client, conversationId, { branch: 'query_explorer', step: 'metrics_list' })
}

const handleMetricsList = async (
  client: Client,
  conversationId: string,
  userId: string,
  input: string,
  explorer: ExplorerState,
  datasourceUid: string,
  onBack: () => Promise<void>
) => {
  if (input === '-1') {
    await onBack()
    return
  }
  const metric = pickFromList(explorer.metricsList ?? [], input)
  if (!metric) {
    await showList(client, conversationId, userId, 'Invalid selection. Metrics:', explorer.metricsList ?? [], [
      { label: 'Back', value: '-1' },
    ])
    return
  }
  let labelNames
  try {
    const { output } = await client.callAction({ type: `${GRAFANA}:listLabelNames`, input: { datasourceUid } })
    labelNames = output.labelNames
  } catch (err) {
    await reply(
      client,
      conversationId,
      userId,
      `Failed to list label names: ${err instanceof Error ? err.message : String(err)}`
    )
    return
  }
  if (!labelNames?.length) {
    await reply(client, conversationId, userId, 'Failed to list label names: no labels found.')
    return
  }
  const updatedExplorer: ExplorerState = { ...explorer, metric, currentParams: [], labelNamesList: labelNames }
  await setFlowState(client, conversationId, { explorerState: updatedExplorer })
  await showLabelNamesList(client, conversationId, userId, updatedExplorer)
}

type LabelNamesCallbacks = { onBack: () => Promise<void>; onQuerySet: (query: string) => Promise<void> }

const handleLabelNamesList = async (
  client: Client,
  conversationId: string,
  userId: string,
  input: string,
  explorer: ExplorerState,
  datasourceUid: string,
  { onBack, onQuerySet }: LabelNamesCallbacks
) => {
  const metric = explorer.metric ?? ''
  const params = explorer.currentParams ?? []

  if (input === '0') {
    await onQuerySet(buildQuery(metric, params))
    return
  }

  if (input === '-1') {
    if (params.length > 0) {
      const updatedExplorer: ExplorerState = { ...explorer, currentParams: params.slice(0, -1) }
      await setFlowState(client, conversationId, { explorerState: updatedExplorer })
      await showLabelNamesList(client, conversationId, userId, updatedExplorer)
    } else {
      await onBack()
    }
    return
  }

  const labelName = pickFromList(explorer.labelNamesList ?? [], input)
  if (!labelName) {
    await showLabelNamesList(client, conversationId, userId, explorer)
    return
  }

  let labelValues
  try {
    const { output } = await client.callAction({
      type: `${GRAFANA}:listLabelValues`,
      input: { datasourceUid, labelName },
    })
    labelValues = output.labelValues
  } catch (err) {
    await reply(
      client,
      conversationId,
      userId,
      `Failed to list values for "${labelName}": ${err instanceof Error ? err.message : String(err)}`
    )
    return
  }
  if (!labelValues?.length) {
    await reply(client, conversationId, userId, `Failed to list values for "${labelName}": no values found.`)
    return
  }
  const updatedExplorer: ExplorerState = { ...explorer, selectedLabelName: labelName, labelValuesList: labelValues }
  await setFlowState(client, conversationId, { explorerState: updatedExplorer })
  await showList(client, conversationId, userId, `Label: ${labelName}`, labelValues, [
    { label: 'Back to labels', value: '-1' },
  ])
  await setTags(client, conversationId, { branch: 'query_explorer', step: 'label_values_list' })
}

const handleLabelValuesList = async (
  client: Client,
  conversationId: string,
  userId: string,
  input: string,
  explorer: ExplorerState
) => {
  if (input === '-1') {
    await showLabelNamesList(client, conversationId, userId, explorer)
    return
  }
  const value = pickFromList(explorer.labelValuesList ?? [], input)
  if (!value) {
    await showList(
      client,
      conversationId,
      userId,
      `Invalid selection. Label: ${explorer.selectedLabelName}`,
      explorer.labelValuesList ?? [],
      [{ label: 'Back to labels', value: '-1' }]
    )
    return
  }
  const params = [...(explorer.currentParams ?? []), { label: explorer.selectedLabelName!, value }]
  const updatedExplorer: ExplorerState = { ...explorer, currentParams: params }
  await setFlowState(client, conversationId, { explorerState: updatedExplorer })
  await showLabelNamesList(client, conversationId, userId, updatedExplorer)
}

export const handleQueryExplorer = async (
  client: Client,
  conversationId: string,
  userId: string,
  step: string,
  input: string,
  onBack: () => Promise<void>,
  onQuerySet: (query: string) => Promise<void>
) => {
  const state = await getFlowState(client, conversationId)
  const explorer: ExplorerState = state.explorerState ?? {}
  const datasourceUid = getDatasourceUid(state)

  if (step === 'metrics_list') {
    return handleMetricsList(client, conversationId, userId, input, explorer, datasourceUid, onBack)
  }
  if (step === 'label_names_list') {
    return handleLabelNamesList(client, conversationId, userId, input, explorer, datasourceUid, { onBack, onQuerySet })
  }
  if (step === 'label_values_list') {
    return handleLabelValuesList(client, conversationId, userId, input, explorer)
  }
}
