import { GRAFANA } from '../const'
import type { AlertRuleForm } from '../types'
import {
  Client,
  Logger,
  callLLM,
  getFlowState,
  goToMainMenu,
  registerAlertSubscription,
  reply,
  setFlowState,
  setTags,
  showList,
  showMenu,
} from '../utils'
import { startContactPointPicker } from './contactPointPicker'
import { startFolderPicker } from './folderPicker'
import { startNotificationPolicyExplorer } from './notificationPolicyExplorer'
import { startPanelDatasource } from './panelDatasource'

type FieldDef =
  | { kind: 'text'; key: keyof AlertRuleForm; label: string }
  | { kind: 'folder'; label: string }
  | { kind: 'datasource'; label: string }
  | { kind: 'threshold'; label: string }
  | { kind: 'receiver'; label: string }
  | { kind: 'labels'; label: string }

const ALL_FIELDS: FieldDef[] = [
  { kind: 'text', key: 'title', label: 'Title' },
  { kind: 'folder', label: 'Folder' },
  { kind: 'datasource', label: 'Datasource / Query' },
  { kind: 'threshold', label: 'Threshold' },
  { kind: 'text', key: 'forDuration', label: 'For duration (e.g. 5m)' },
  { kind: 'text', key: 'ruleGroup', label: 'Rule group name' },
  { kind: 'receiver', label: 'Contact point (receiver)' },
  { kind: 'labels', label: 'Labels' },
]

const formatDatasource = (form: AlertRuleForm): string => {
  if (!form.datasourceUid && !form.query) return '(not set)'
  let q: string
  if (form.query === undefined) {
    q = '?'
  } else {
    q = form.query.length > 30 ? form.query.slice(0, 30) + '…' : form.query
  }
  return `${form.datasourceUid ?? '?'} / ${q}`
}

const formatThreshold = (form: AlertRuleForm): string => {
  if (!form.thresholdType || form.thresholdValue === undefined) return '(not set)'
  return `${form.reducer ?? 'mean'} ${form.thresholdType} ${form.thresholdValue}`
}

const formatLabels = (form: AlertRuleForm): string => {
  if (!form.labels || Object.keys(form.labels).length === 0) return '(not set)'
  return Object.entries(form.labels)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ')
}

const formatFieldValue = (form: AlertRuleForm, field: FieldDef): string => {
  if (field.kind === 'text') return (form[field.key] as string | undefined) ?? '(not set)'
  if (field.kind === 'folder') return form.folderUID ?? '(not set)'
  if (field.kind === 'datasource') return formatDatasource(form)
  if (field.kind === 'threshold') return formatThreshold(form)
  if (field.kind === 'receiver') return form.receiver ?? '(not set)'
  return formatLabels(form)
}

const ALERT_RULE_CONTROLS = [
  { label: 'Create alert rule', value: '0' },
  { label: 'Cancel', value: '-1' },
]
const CONFIRM_DASHBOARD_CONTROLS = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
]

const showOptionalMenu = async (client: Client, conversationId: string, userId: string, form: AlertRuleForm) => {
  const items = ALL_FIELDS.map((f) => `${f.label}: ${formatFieldValue(form, f)}`)
  await showList(client, conversationId, userId, 'Alert rule settings:', items, ALERT_RULE_CONTROLS)
}

const patchAlertRuleAndShowMenu = async (
  client: Client,
  conversationId: string,
  userId: string,
  patch: Partial<AlertRuleForm>
) => {
  const state = await getFlowState(client, conversationId)
  const updatedForm = { ...state.alertRuleForm, ...patch }
  await setFlowState(client, conversationId, { alertRuleForm: updatedForm })
  await showOptionalMenu(client, conversationId, userId, updatedForm)
  await setTags(client, conversationId, { branch: 'create_alert_rule', step: 'optional' })
}

const applyQueryFromPanelForm = async (client: Client, conversationId: string): Promise<AlertRuleForm> => {
  const state = await getFlowState(client, conversationId)
  const updatedForm = {
    ...state.alertRuleForm,
    datasourceUid: state.panelForm?.datasourceUid,
    query: state.panelForm?.query,
  }
  await setFlowState(client, conversationId, { alertRuleForm: updatedForm })
  return updatedForm
}

const startDatasourceQuery = async (client: Client, conversationId: string, userId: string) => {
  await setFlowState(client, conversationId, { callerBranch: 'create_alert_rule' })
  await startPanelDatasource(client, conversationId, userId)
}

export const startCreateAlertRule = async (client: Client, conversationId: string, userId: string) => {
  await setFlowState(client, conversationId, { alertRuleForm: {} })
  await reply(client, conversationId, userId, 'Enter the alert rule title:')
  await setTags(client, conversationId, { branch: 'create_alert_rule', step: 'title' })
}

export const applyAlertFolderUid = async (client: Client, conversationId: string, userId: string, uid: string) => {
  const state = await getFlowState(client, conversationId)
  await setFlowState(client, conversationId, { alertRuleForm: { ...state.alertRuleForm, folderUID: uid } })
  await startDatasourceQuery(client, conversationId, userId)
}

export const resumeAlertRuleFromQuery = async (client: Client, conversationId: string, userId: string) => {
  await applyQueryFromPanelForm(client, conversationId)
  await reply(client, conversationId, userId, 'Enter the threshold (e.g. "mean more than 5", "last at most 100"):')
  await setTags(client, conversationId, { branch: 'create_alert_rule', step: 'threshold' })
}

export const applyLabelsFromPolicy = async (
  client: Client,
  conversationId: string,
  userId: string,
  labels: Record<string, string>
) => patchAlertRuleAndShowMenu(client, conversationId, userId, { labels })

export const resumeCreateAlertRuleOptional = async (client: Client, conversationId: string, userId: string) =>
  patchAlertRuleAndShowMenu(client, conversationId, userId, {})

export const applyAlertFolderUidOptional = async (
  client: Client,
  conversationId: string,
  userId: string,
  uid: string
) => patchAlertRuleAndShowMenu(client, conversationId, userId, { folderUID: uid })

export const resumeAlertRuleFromQueryOptional = async (client: Client, conversationId: string, userId: string) => {
  const updatedForm = await applyQueryFromPanelForm(client, conversationId)
  await showOptionalMenu(client, conversationId, userId, updatedForm)
  await setTags(client, conversationId, { branch: 'create_alert_rule', step: 'optional' })
}

export const applyContactPointToAlertRule = async (
  client: Client,
  conversationId: string,
  userId: string,
  name: string
) => patchAlertRuleAndShowMenu(client, conversationId, userId, { receiver: name })

const handleThresholdStep = async (
  client: Client,
  logger: Logger,
  conversationId: string,
  userId: string,
  form: AlertRuleForm,
  input: string
) => {
  const validTypes: AlertRuleForm['thresholdType'][] = ['gt', 'lt', 'gte', 'lte']
  const validReducers: AlertRuleForm['reducer'][] = ['last', 'mean', 'max', 'min']

  const parsed = await callLLM(
    client,
    logger,
    'Extract a reducer function, comparison operator, and numeric value from the user input. Reply with only JSON: {"reducer": "last"|"mean"|"max"|"min"|null, "type": "gt"|"lt"|"gte"|"lte", "value": <number>}. If reducer is not mentioned, set it to null. If type or value is unclear, set that field to null.',
    input
  )

  const thresholdType =
    parsed && validTypes.includes(parsed.type) ? (parsed.type as AlertRuleForm['thresholdType']) : null
  const thresholdValue = parsed && typeof parsed.value === 'number' && !Number.isNaN(parsed.value) ? parsed.value : null
  const reducer = parsed && validReducers.includes(parsed.reducer) ? (parsed.reducer as AlertRuleForm['reducer']) : null

  if (!thresholdType || thresholdValue === null) {
    await reply(
      client,
      conversationId,
      userId,
      'Could not understand that. Try something like "mean more than 5" or "last at most 100".'
    )
    return
  }

  const updatedForm = { ...form, thresholdType, thresholdValue, ...(reducer && { reducer }) }
  await setFlowState(client, conversationId, { alertRuleForm: updatedForm })
  await showOptionalMenu(client, conversationId, userId, updatedForm)
  await setTags(client, conversationId, { branch: 'create_alert_rule', step: 'optional' })
}

export const handleCreateAlertRule = async (
  client: Client,
  logger: Logger,
  conversationId: string,
  userId: string,
  step: string,
  input: string
) => {
  const state = await getFlowState(client, conversationId)
  const form = state.alertRuleForm ?? {}

  if (step === 'title') {
    await setFlowState(client, conversationId, { alertRuleForm: { ...form, title: input } })
    await startFolderPicker(client, conversationId, userId, 'create_alert_rule')
    return
  }

  if (step === 'threshold') {
    await handleThresholdStep(client, logger, conversationId, userId, form, input)
    return
  }

  if (step === 'optional') {
    await handleOptionalStep(client, conversationId, userId, form, input)
    return
  }

  if (step === 'confirm_dashboard') {
    if (input === 'yes') {
      await submitWithVisualization(client, logger, conversationId, userId)
    } else {
      await submitCreateAlertRule(client, logger, conversationId, userId)
    }
    return
  }

  if (step.startsWith('set_')) {
    const key = step.replace('set_', '') as keyof AlertRuleForm
    const updatedForm = { ...form, [key]: input }
    await setFlowState(client, conversationId, { alertRuleForm: updatedForm })
    await showOptionalMenu(client, conversationId, userId, updatedForm)
    await setTags(client, conversationId, { branch: 'create_alert_rule', step: 'optional' })
  }
}

const handleOptionalStep = async (
  client: Client,
  conversationId: string,
  userId: string,
  form: AlertRuleForm,
  input: string
) => {
  if (input === '-1') {
    await reply(client, conversationId, userId, 'Operation cancelled.')
    await goToMainMenu(client, conversationId, userId)
    return
  }
  if (input === '0') {
    await showMenu(
      client,
      conversationId,
      userId,
      'Do you want to create a dashboard to visualise this alert?',
      CONFIRM_DASHBOARD_CONTROLS
    )
    await setTags(client, conversationId, { branch: 'create_alert_rule', step: 'confirm_dashboard' })
    return
  }
  const index = Number.parseInt(input) - 1
  const field = ALL_FIELDS[index]
  if (!field || Number.isNaN(index)) {
    await reply(client, conversationId, userId, 'Invalid option.')
    await showOptionalMenu(client, conversationId, userId, form)
    return
  }
  if (field.kind === 'text') {
    await reply(client, conversationId, userId, `Enter value for "${field.label}":`)
    await setTags(client, conversationId, { branch: 'create_alert_rule', step: `set_${field.key}` })
    return
  }
  if (field.kind === 'folder') {
    await startFolderPicker(client, conversationId, userId, 'create_alert_rule_optional')
    return
  }
  if (field.kind === 'datasource') {
    await setFlowState(client, conversationId, { callerBranch: 'create_alert_rule_optional' })
    await startPanelDatasource(client, conversationId, userId)
    return
  }
  if (field.kind === 'threshold') {
    await reply(client, conversationId, userId, 'Enter the threshold (e.g. "mean more than 5", "last at most 100"):')
    await setTags(client, conversationId, { branch: 'create_alert_rule', step: 'threshold' })
    return
  }
  if (field.kind === 'labels') {
    await startNotificationPolicyExplorer(client, conversationId, userId, 'create_alert_rule_labels')
    return
  }
  await startContactPointPicker(client, conversationId, userId, 'create_alert_rule')
}

const submitWithVisualization = async (client: Client, logger: Logger, conversationId: string, userId: string) => {
  const state = await getFlowState(client, conversationId)
  const form = state.alertRuleForm ?? {}

  const dashboardTitle = `${form.title}_visualisation`
  const dashboardUid = dashboardTitle.toLowerCase().replaceAll(/\s+/g, '-')
  const panelId = 1

  const { output: dashOutput } = await client.callAction({
    type: `${GRAFANA}:createDashboard`,
    input: {
      uid: dashboardUid,
      title: dashboardTitle,
      folderUid: form.folderUID,
      panels: [
        {
          type: 'timeseries',
          title: form.title!,
          id: panelId,
          gridPos: { w: 24, h: 8 },
          datasource: { type: 'prometheus', uid: form.datasourceUid! },
          targets: [{ refId: 'A', expr: form.query! }],
        },
      ],
    },
  })

  const { success: dashSuccess, error: dashError } = dashOutput
  if (!dashSuccess) {
    await reply(
      client,
      conversationId,
      userId,
      `Could not create dashboard: ${dashError ?? 'Unknown error.'}. Creating alert rule without visualisation.`
    )
    await submitCreateAlertRule(client, logger, conversationId, userId)
    return
  }

  await submitCreateAlertRule(client, logger, conversationId, userId, dashboardUid, String(panelId))
}

const submitCreateAlertRule = async (
  client: Client,
  logger: Logger,
  conversationId: string,
  userId: string,
  dashboardUid?: string,
  panelId?: string
) => {
  const state = await getFlowState(client, conversationId)
  const form = state.alertRuleForm ?? {}

  const botpressId = await registerAlertSubscription(client, logger, conversationId)

  const { output } = await client.callAction({
    type: `${GRAFANA}:createAlertRule`,
    input: {
      title: form.title!,
      folderUID: form.folderUID!,
      dataArray: {
        datasourceUid: form.datasourceUid!,
        query: form.query!,
        reducer: form.reducer ?? 'mean',
        thresholdType: form.thresholdType!,
        thresholdValue: form.thresholdValue!,
      },
      botpressId,
      forDuration: form.forDuration ?? '30s',
      ...(form.ruleGroup && { ruleGroup: form.ruleGroup }),
      ...(form.labels && { labels: form.labels }),
      ...(form.receiver && { notification_settings: { receiver: form.receiver } }),
      ...(dashboardUid && { dashboardUid }),
      ...(panelId && { panelId }),
    },
  })

  const { success, error } = output as { success: boolean; error?: string }

  if (success) {
    await reply(
      client,
      conversationId,
      userId,
      `Alert rule "${form.title}" created. You'll be notified here when it fires.`
    )
  } else {
    await reply(client, conversationId, userId, `Failed to create alert rule: ${error ?? 'Unknown error.'}`)
  }

  await goToMainMenu(client, conversationId, userId)
}
