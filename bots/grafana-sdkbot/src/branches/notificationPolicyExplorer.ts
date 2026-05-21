import { GRAFANA } from '../const'
import type { NotificationPolicy, NotificationPolicyForm, NotificationPolicyMatcher } from '../types'
import {
  Client,
  Logger,
  callLLM,
  getFlowState,
  goToMainMenu,
  pickFromList,
  reply,
  setFlowState,
  setTags,
  showList,
  showMenu,
} from '../utils'
import { startContactPointPicker } from './contactPointPicker'

const LIST_CONTROLS = [
  { label: 'Create notification policy', value: '0' },
  { label: 'Cancel', value: '-1' },
]
const POLICY_OPT_CONTROLS = [
  { label: 'Create policy', value: '0' },
  { label: 'Cancel', value: '-1' },
]

type PolicyOptField = { key: keyof NotificationPolicyForm; label: string; kind: 'text' | 'array' | 'boolean' }

const POLICY_OPT_FIELDS: PolicyOptField[] = [
  { key: 'continue', label: 'Continue matching', kind: 'boolean' },
  { key: 'group_by', label: 'Group by', kind: 'array' },
  { key: 'group_wait', label: 'Group wait', kind: 'text' },
  { key: 'group_interval', label: 'Group interval', kind: 'text' },
  { key: 'repeat_interval', label: 'Repeat interval', kind: 'text' },
  { key: 'mute_time_intervals', label: 'Mute time intervals', kind: 'array' },
  { key: 'active_time_intervals', label: 'Active time intervals', kind: 'array' },
]

const formatPolicyFieldValue = (form: NotificationPolicyForm, key: keyof NotificationPolicyForm): string => {
  const value = form[key]
  if (value === undefined) return '(not set)'
  if (typeof value === 'boolean') return value ? 'yes' : 'no'
  if (Array.isArray(value)) return value.length > 0 ? value.map(String).join(', ') : '(not set)'
  return String(value)
}

const extractLabels = (policy: NotificationPolicy): Record<string, string> => {
  const result: Record<string, string> = {}
  const matchers: any[] = policy.object_matchers ?? policy.matchers ?? []
  for (const m of matchers) {
    if (typeof m === 'string') {
      const eqIdx = m.indexOf('=')
      if (eqIdx !== -1) result[m.slice(0, eqIdx).trim()] = m.slice(eqIdx + 1).trim()
    } else if (Array.isArray(m) && m[0]) {
      result[String(m[0])] = String(m[2] ?? '')
    } else if (m && typeof m === 'object') {
      const name = m.name ?? m.label
      if (name) result[String(name)] = String(m.value ?? '')
    }
  }
  return result
}

const policyLabel = (p: NotificationPolicy): string => {
  const matchers: any[] = p.object_matchers ?? p.matchers ?? []
  const matcherStr = matchers
    .map((m) => {
      if (typeof m === 'string') return m
      if (Array.isArray(m)) return `${m[0]}=${m[2]}`
      if (m && typeof m === 'object') return `${m.name ?? m.label}=${m.value}`
      return ''
    })
    .filter(Boolean)
    .join(', ')
  const suffix = matcherStr ? ' [' + matcherStr + ']' : ''
  return (p.receiver ?? '(no receiver)') + suffix
}

export const applyContactPointToNotifPolicy = async (
  client: Client,
  conversationId: string,
  userId: string,
  name: string
) => {
  const state = await getFlowState(client, conversationId)
  const updatedForm: NotificationPolicyForm = { ...state.notificationPolicyForm, receiver: name }
  await setFlowState(client, conversationId, { notificationPolicyForm: updatedForm })
  await showMenu(
    client,
    conversationId,
    userId,
    'Enter label matchers (e.g. "label_severity=critical label_team!=warning"):',
    [{ label: 'Skip', value: '0' }]
  )
  await setTags(client, conversationId, { branch: 'notif_policy_explorer', step: 'create_matchers' })
}

export const startNotificationPolicyExplorer = async (
  client: Client,
  conversationId: string,
  userId: string,
  returnBranch: string
) => {
  await setFlowState(client, conversationId, { callerBranch: returnBranch })

  try {
    const { output } = await client.callAction({ type: `${GRAFANA}:listNotificationPolicies`, input: {} })
    const { policies } = output
    if (!policies?.length) {
      await showMenu(client, conversationId, userId, 'No notification policies found.', LIST_CONTROLS)
    } else {
      await setFlowState(client, conversationId, { notificationPolicyList: policies })
      await showList(
        client,
        conversationId,
        userId,
        'Select a notification policy to use its labels:',
        policies.map(policyLabel),
        LIST_CONTROLS
      )
    }
  } catch (err) {
    await showMenu(
      client,
      conversationId,
      userId,
      `Failed to list notification policies: ${err instanceof Error ? err.message : String(err)}`,
      LIST_CONTROLS
    )
  }

  await setTags(client, conversationId, { branch: 'notif_policy_explorer', step: 'list' })
}

const MATCHERS_PROMPT =
  'Parse the user input into an array of label matchers. Each matcher has: name (string), operator ("=" | "!=" | "=~" | "!~"), value (string). Examples: "label_severity=critical" → [{"name":"label_severity","operator":"=","value":"critical"}]. Reply with only a JSON array. If nothing can be parsed, return [].'

const showNotifPolicyCreateMenu = async (
  client: Client,
  conversationId: string,
  userId: string,
  form: NotificationPolicyForm
) => {
  const matcherStr = form.matchers?.map((m) => `${m.name}${m.operator}${m.value}`).join(', ') || '(none)'
  const header = `Receiver: ${form.receiver ?? '(not set)'}\nMatchers: ${matcherStr}`
  const items = POLICY_OPT_FIELDS.map((f) => `${f.label}: ${formatPolicyFieldValue(form, f.key)}`)
  await showList(client, conversationId, userId, header, items, POLICY_OPT_CONTROLS)
  await setTags(client, conversationId, { branch: 'notif_policy_explorer', step: 'create_optional' })
}

const handleCreateMatchersStep = async (
  client: Client,
  logger: Logger,
  conversationId: string,
  userId: string,
  state: { notificationPolicyForm?: NotificationPolicyForm },
  input: string
) => {
  if (input === '0') {
    const form = { ...state.notificationPolicyForm, matchers: [] as NotificationPolicyMatcher[] }
    await setFlowState(client, conversationId, { notificationPolicyForm: form })
    await showNotifPolicyCreateMenu(client, conversationId, userId, form)
    return
  }
  const parsed = await callLLM(client, logger, MATCHERS_PROMPT, input)
  if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
    await reply(
      client,
      conversationId,
      userId,
      'Could not parse matchers. Try something like "label_severity=critical label_team!=backend".'
    )
    return
  }
  const matchers = parsed as unknown as NotificationPolicyMatcher[]
  const invalid = matchers.filter((m) => !String(m.name ?? '').startsWith('label_'))
  if (invalid.length) {
    const names = invalid.map((m) => `"${m.name}"`).join(', ')
    await reply(
      client,
      conversationId,
      userId,
      `These matcher names must start with "label_": ${names}. Please re-enter.`
    )
    return
  }
  const form = { ...state.notificationPolicyForm, matchers }
  await setFlowState(client, conversationId, { notificationPolicyForm: form })
  await showNotifPolicyCreateMenu(client, conversationId, userId, form)
}

const submitCreateNotifPolicy = async (
  client: Client,
  conversationId: string,
  userId: string,
  onDone: () => Promise<void>
) => {
  const state = await getFlowState(client, conversationId)
  const form = state.notificationPolicyForm ?? {}

  if (!form.receiver) {
    await reply(client, conversationId, userId, 'A contact point (receiver) is required. Please select one first.')
    await showNotifPolicyCreateMenu(client, conversationId, userId, form)
    return
  }

  try {
    await client.callAction({
      type: `${GRAFANA}:createNotificationPolicy`,
      input: {
        receiver: form.receiver,
        ...(form.matchers?.length && { matchers: form.matchers }),
        ...(form.continue !== undefined && { continue: form.continue }),
        ...(form.group_by?.length && { group_by: form.group_by }),
        ...(form.group_wait && { group_wait: form.group_wait }),
        ...(form.group_interval && { group_interval: form.group_interval }),
        ...(form.repeat_interval && { repeat_interval: form.repeat_interval }),
        ...(form.mute_time_intervals?.length && { mute_time_intervals: form.mute_time_intervals }),
        ...(form.active_time_intervals?.length && { active_time_intervals: form.active_time_intervals }),
      },
    })
    await reply(client, conversationId, userId, `Notification policy created for receiver "${form.receiver}".`)
  } catch (err) {
    await reply(
      client,
      conversationId,
      userId,
      `Failed to create notification policy: ${err instanceof Error ? err.message : String(err)}`
    )
  }

  await onDone()
}

const handleCreateOptionalStep = async (
  client: Client,
  conversationId: string,
  userId: string,
  form: NotificationPolicyForm,
  input: string,
  onBack: () => Promise<void>
) => {
  if (input === '-1') {
    await goToMainMenu(client, conversationId, userId)
    return
  }
  if (input === '0') {
    await submitCreateNotifPolicy(client, conversationId, userId, onBack)
    return
  }
  const index = Number.parseInt(input) - 1
  const field = POLICY_OPT_FIELDS[index]
  if (!field || Number.isNaN(index)) {
    await showNotifPolicyCreateMenu(client, conversationId, userId, form)
    return
  }
  if (field.kind === 'boolean') {
    await showMenu(client, conversationId, userId, `Set "${field.label}":`, [
      { label: 'Yes', value: 'true' },
      { label: 'No', value: 'false' },
      { label: 'Unset', value: 'unset' },
    ])
    await setTags(client, conversationId, { branch: 'notif_policy_explorer', step: `create_set_${field.key}` })
    return
  }
  const prompt = field.kind === 'array' ? `Enter ${field.label} (comma-separated):` : `Enter ${field.label}:`
  await reply(client, conversationId, userId, prompt)
  await setTags(client, conversationId, { branch: 'notif_policy_explorer', step: `create_set_${field.key}` })
}

const handleSetFieldStep = async (
  client: Client,
  conversationId: string,
  userId: string,
  step: string,
  input: string
) => {
  const key = step.replace('create_set_', '') as keyof NotificationPolicyForm
  const field = POLICY_OPT_FIELDS.find((f) => f.key === key)
  if (!field) return
  const state = await getFlowState(client, conversationId)
  let value: any
  if (field.kind === 'boolean') {
    if (input === 'true') value = true
    else if (input === 'false') value = false
  } else if (field.kind === 'array') {
    value = input
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  } else {
    value = input
  }
  const updatedForm = { ...state.notificationPolicyForm, [key]: value }
  await setFlowState(client, conversationId, { notificationPolicyForm: updatedForm })
  await showNotifPolicyCreateMenu(client, conversationId, userId, updatedForm)
}

type ExplorerHandlers = { onSelected: (labels: Record<string, string>) => Promise<void>; onBack: () => Promise<void> }

export const handleNotificationPolicyExplorer = async (
  client: Client,
  logger: Logger,
  conversationId: string,
  userId: string,
  step: string,
  input: string,
  handlers: ExplorerHandlers
) => {
  const { onSelected, onBack } = handlers
  if (step === 'create_matchers') {
    const state = await getFlowState(client, conversationId)
    await handleCreateMatchersStep(client, logger, conversationId, userId, state, input)
    return
  }
  if (step === 'create_optional') {
    const state = await getFlowState(client, conversationId)
    await handleCreateOptionalStep(client, conversationId, userId, state.notificationPolicyForm ?? {}, input, onBack)
    return
  }
  if (step.startsWith('create_set_')) {
    await handleSetFieldStep(client, conversationId, userId, step, input)
    return
  }
  if (step === 'list') {
    if (input === '-1') {
      await onBack()
      return
    }
    if (input === '0') {
      await setFlowState(client, conversationId, { notificationPolicyForm: {} })
      await startContactPointPicker(client, conversationId, userId, 'notif_policy')
      return
    }
    const state = await getFlowState(client, conversationId)
    const policies = state.notificationPolicyList ?? []
    const policy = pickFromList(policies, input)
    if (!policy) {
      await showList(
        client,
        conversationId,
        userId,
        'Invalid selection. Pick a notification policy:',
        policies.map(policyLabel),
        LIST_CONTROLS
      )
      return
    }
    await onSelected(extractLabels(policy))
  }
}
