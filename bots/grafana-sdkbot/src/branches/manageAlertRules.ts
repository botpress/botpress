import { GRAFANA } from '../const'
import type { NotificationPolicy } from '../types'
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

const MANAGE_MENU =
  'Manage alert rules:\n1 → Delete alert rule\n2 → Delete contact point\n3 → Delete notification policy\n4 → Unsubscribe to all alerts'

const notifPolicyLabel = (p: NotificationPolicy): string => {
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

type MatcherOperator = '=' | '!=' | '=~' | '!~'
type Matcher = { name: string; operator: MatcherOperator; value: string }

const VALID_OPERATORS = new Set<MatcherOperator>(['=', '!=', '=~', '!~'])
const toOperator = (op: unknown): MatcherOperator => {
  const s = typeof op === 'string' ? op : '='
  return VALID_OPERATORS.has(s as MatcherOperator) ? (s as MatcherOperator) : '='
}

const toMatcher = (m: any): Matcher | null => {
  if (Array.isArray(m) && m[0]) return { name: String(m[0]), operator: toOperator(m[1]), value: String(m[2] ?? '') }
  if (m && typeof m === 'object') {
    return { name: String(m.name ?? ''), operator: toOperator(m.operator), value: String(m.value ?? '') }
  }
  if (typeof m === 'string') {
    const idx = m.indexOf('=')
    return idx === -1 ? null : { name: m.slice(0, idx).trim(), operator: '=', value: m.slice(idx + 1).trim() }
  }
  return null
}

const normalizeMatchers = (policy: NotificationPolicy): Matcher[] =>
  (policy.object_matchers ?? policy.matchers ?? []).map(toMatcher).filter(Boolean) as Matcher[]

export const startManageAlertRules = async (client: Client, conversationId: string, userId: string) => {
  await showMenu(client, conversationId, userId, MANAGE_MENU, [{ label: 'Back', value: '-1' }])
  await setTags(client, conversationId, { branch: 'manage_alert_rules', step: 'menu' })
}

const handleMenuInput = async (client: Client, conversationId: string, userId: string, input: string) => {
  if (input === '-1') {
    await goToMainMenu(client, conversationId, userId)
    return
  }

  if (input === '1') {
    const { output } = await client.callAction({ type: `${GRAFANA}:listAlertRules`, input: {} })
    const { success, data } = output
    if (!success || !data?.length) {
      await reply(client, conversationId, userId, 'No alert rules found.')
      await showMenu(client, conversationId, userId, MANAGE_MENU, [{ label: 'Back', value: '-1' }])
      return
    }
    await setFlowState(client, conversationId, { alertRuleList: data })
    await showList(
      client,
      conversationId,
      userId,
      'Alert rules:',
      data.map((r) => `${r.title ?? r.uid} (${r.ruleGroup ?? 'no group'})`),
      [{ label: 'Cancel', value: '-1' }]
    )
    await setTags(client, conversationId, { branch: 'manage_alert_rules', step: 'delete_rule_select' })
    return
  }

  if (input === '2') {
    const { output } = await client.callAction({ type: `${GRAFANA}:listContactPoints`, input: {} })
    const { success, data } = output
    if (!success || !data?.length) {
      await reply(client, conversationId, userId, 'No contact points found.')
      await showMenu(client, conversationId, userId, MANAGE_MENU, [{ label: 'Back', value: '-1' }])
      return
    }
    await setFlowState(client, conversationId, { contactPointList: data })
    await showList(
      client,
      conversationId,
      userId,
      'Contact points:',
      data.map((cp) => `${cp.name ?? cp.uid} (${cp.type})`),
      [{ label: 'Cancel', value: '-1' }]
    )
    await setTags(client, conversationId, { branch: 'manage_alert_rules', step: 'delete_contact_point_select' })
    return
  }

  if (input === '3') {
    const { output } = (await client.callAction({ type: `${GRAFANA}:listNotificationPolicies`, input: {} })) as {
      output: { success: boolean; data?: NotificationPolicy[]; error?: string }
    }
    if (!output.success || !output.data?.length) {
      await reply(client, conversationId, userId, output.error ?? 'No notification policies found.')
      await showMenu(client, conversationId, userId, MANAGE_MENU, [{ label: 'Back', value: '-1' }])
      return
    }
    await setFlowState(client, conversationId, { notificationPolicyList: output.data })
    await showList(client, conversationId, userId, 'Notification policies:', output.data.map(notifPolicyLabel), [
      { label: 'Cancel', value: '-1' },
    ])
    await setTags(client, conversationId, { branch: 'manage_alert_rules', step: 'delete_notif_policy_select' })
    return
  }

  if (input === '4') {
    const { rows } = await client.findTableRows({ table: 'alertSubscriptionsTable', filter: { conversationId } })
    if (rows.length) {
      await client.deleteTableRows({ table: 'alertSubscriptionsTable', ids: rows.map((r) => r.id) })
    }
    await reply(client, conversationId, userId, 'Unsubscribed from all alerts.')
    await showMenu(client, conversationId, userId, MANAGE_MENU, [{ label: 'Back', value: '-1' }])
    return
  }

  await reply(client, conversationId, userId, 'Invalid option.')
  await showMenu(client, conversationId, userId, MANAGE_MENU, [{ label: 'Back', value: '-1' }])
}

const handleDeleteRuleSelect = async (client: Client, conversationId: string, userId: string, input: string) => {
  if (input === '-1') {
    await showMenu(client, conversationId, userId, MANAGE_MENU, [{ label: 'Back', value: '-1' }])
    await setTags(client, conversationId, { branch: 'manage_alert_rules', step: 'menu' })
    return
  }

  const state = await getFlowState(client, conversationId)
  const alertRules = state.alertRuleList ?? []
  const rule = pickFromList(alertRules, input)
  if (!rule) {
    await showList(
      client,
      conversationId,
      userId,
      'Invalid selection. Alert rules:',
      alertRules.map((r) => `${r.title ?? r.uid} (${r.ruleGroup ?? 'no group'})`),
      [{ label: 'Cancel', value: '-1' }]
    )
    return
  }
  if (!rule.uid) {
    await reply(client, conversationId, userId, 'Alert rule has no UID, cannot delete.')
    await showMenu(client, conversationId, userId, MANAGE_MENU, [{ label: 'Back', value: '-1' }])
    await setTags(client, conversationId, { branch: 'manage_alert_rules', step: 'menu' })
    return
  }

  const { output: ruleOutput } = await client.callAction({ type: `${GRAFANA}:getAlertRule`, input: { uid: rule.uid } })
  const { data: ruleData } = ruleOutput
  const botpressId = ruleData?.labels?.botpress_id
  if (botpressId) {
    const { rows } = await client.findTableRows({ table: 'alertSubscriptionsTable', filter: { botpressId } })
    if (rows.length) {
      await client.deleteTableRows({ table: 'alertSubscriptionsTable', ids: rows.map((r) => r.id) })
    }
  }

  const { output } = await client.callAction({ type: `${GRAFANA}:deleteAlertRule`, input: { uid: rule.uid } })
  const { success, error } = output
  const msg = success
    ? `Alert rule "${rule.title ?? rule.uid}" deleted successfully.`
    : `Failed to delete alert rule: ${error ?? 'Unknown error.'}`
  await reply(client, conversationId, userId, msg)
  await showMenu(client, conversationId, userId, MANAGE_MENU, [{ label: 'Back', value: '-1' }])
  await setTags(client, conversationId, { branch: 'manage_alert_rules', step: 'menu' })
}

const handleDeleteContactPointSelect = async (
  client: Client,
  conversationId: string,
  userId: string,
  input: string
) => {
  if (input === '-1') {
    await showMenu(client, conversationId, userId, MANAGE_MENU, [{ label: 'Back', value: '-1' }])
    await setTags(client, conversationId, { branch: 'manage_alert_rules', step: 'menu' })
    return
  }

  const state = await getFlowState(client, conversationId)
  const contactPoints = state.contactPointList ?? []
  const cp = pickFromList(contactPoints, input)
  if (!cp) {
    await showList(
      client,
      conversationId,
      userId,
      'Invalid selection. Contact points:',
      contactPoints.map((c) => `${c.name ?? c.uid} (${c.type})`),
      [{ label: 'Cancel', value: '-1' }]
    )
    return
  }
  if (!cp.uid) {
    await reply(client, conversationId, userId, 'Contact point has no UID, cannot delete.')
    await showMenu(client, conversationId, userId, MANAGE_MENU, [{ label: 'Back', value: '-1' }])
    await setTags(client, conversationId, { branch: 'manage_alert_rules', step: 'menu' })
    return
  }

  const { output } = await client.callAction({ type: `${GRAFANA}:deleteContactPoint`, input: { uid: cp.uid } })
  const { success, error } = output
  const msg = success
    ? `Contact point "${cp.name ?? cp.uid}" deleted successfully.`
    : `Failed to delete contact point: ${error ?? 'Unknown error.'}`
  await reply(client, conversationId, userId, msg)
  await showMenu(client, conversationId, userId, MANAGE_MENU, [{ label: 'Back', value: '-1' }])
  await setTags(client, conversationId, { branch: 'manage_alert_rules', step: 'menu' })
}

const handleDeleteNotifPolicySelect = async (client: Client, conversationId: string, userId: string, input: string) => {
  if (input === '-1') {
    await showMenu(client, conversationId, userId, MANAGE_MENU, [{ label: 'Back', value: '-1' }])
    await setTags(client, conversationId, { branch: 'manage_alert_rules', step: 'menu' })
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
      'Invalid selection. Notification policies:',
      policies.map(notifPolicyLabel),
      [{ label: 'Cancel', value: '-1' }]
    )
    return
  }
  if (!policy.receiver) {
    await reply(client, conversationId, userId, 'This policy has no receiver and cannot be deleted.')
    await showMenu(client, conversationId, userId, MANAGE_MENU, [{ label: 'Back', value: '-1' }])
    await setTags(client, conversationId, { branch: 'manage_alert_rules', step: 'menu' })
    return
  }
  const matchers = normalizeMatchers(policy)
  if (!matchers.length) {
    await reply(client, conversationId, userId, 'This policy has no matchers and cannot be identified for deletion.')
    await showMenu(client, conversationId, userId, MANAGE_MENU, [{ label: 'Back', value: '-1' }])
    await setTags(client, conversationId, { branch: 'manage_alert_rules', step: 'menu' })
    return
  }
  const { output } = (await client.callAction({
    type: `${GRAFANA}:deleteNotificationPolicy`,
    input: { receiver: policy.receiver, matchers },
  })) as { output: { success: boolean; error?: string } }
  const { success, error } = output
  const msg = success
    ? `Notification policy for receiver "${policy.receiver}" deleted successfully.`
    : `Failed to delete notification policy: ${error ?? 'Unknown error.'}`
  await reply(client, conversationId, userId, msg)
  await showMenu(client, conversationId, userId, MANAGE_MENU, [{ label: 'Back', value: '-1' }])
  await setTags(client, conversationId, { branch: 'manage_alert_rules', step: 'menu' })
}

export const handleManageAlertRules = async (
  client: Client,
  conversationId: string,
  userId: string,
  step: string,
  input: string
) => {
  if (step === 'menu') return handleMenuInput(client, conversationId, userId, input)
  if (step === 'delete_rule_select') return handleDeleteRuleSelect(client, conversationId, userId, input)
  if (step === 'delete_contact_point_select') {
    return handleDeleteContactPointSelect(client, conversationId, userId, input)
  }
  if (step === 'delete_notif_policy_select') return handleDeleteNotifPolicySelect(client, conversationId, userId, input)
}
