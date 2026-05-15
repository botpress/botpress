import { randomUUID } from 'node:crypto'
import { handleContactPointPicker } from './branches/contactPointPicker'
import {
  handleCreateAlertRule,
  applyAlertFolderUid,
  resumeAlertRuleFromQuery,
  applyAlertFolderUidOptional,
  resumeAlertRuleFromQueryOptional,
  resumeCreateAlertRuleOptional,
  applyLabelsFromPolicy,
  applyContactPointToAlertRule,
} from './branches/createAlertRule'
import { handleCreateDashboard, applyFolderUid, applyPanel } from './branches/createDashboard'
import {
  handleEditDashboard,
  handleEditDashboardUidInput,
  handleEditDashboardUidSelect,
  resumeEditPanel,
  applyEditFolderUid,
} from './branches/editDashboard'
import { handleFolderPicker } from './branches/folderPicker'
import { handleGetDashboard, handleGetDashboardSelect } from './branches/getDashboard'
import { handleMain } from './branches/main'
import { handleManageAlertRules } from './branches/manageAlertRules'
import { handleNotificationPolicyExplorer, applyContactPointToNotifPolicy } from './branches/notificationPolicyExplorer'
import { handleNotifications } from './branches/notifications'
import { handlePanelCreator, resumePanelCreator } from './branches/panelCreator'
import { handlePanelDatasource, applyQuery, resumeToQueryPrompt } from './branches/panelDatasource'
import { handlePanelGrid } from './branches/panelGrid'
import { handleQueryExplorer } from './branches/queryExplorer'
import { Client, Logger, getNotifState, setNotifState, reply, getFlowState, goToMainMenu } from './utils'
import * as bp from '.botpress'

const bot = new bp.Bot({ actions: {} })

export default bot

const handleFolderPickerBranch = async (
  client: Client,
  conversationId: string,
  userId: string,
  step: string,
  input: string
) => {
  const state = await getFlowState(client, conversationId)
  const onSelected = async (uid: string) => {
    if (state.folderPickerReturnBranch === 'create_dashboard') await applyFolderUid(client, conversationId, userId, uid)
    else if (state.folderPickerReturnBranch === 'edit_dashboard') {
      await applyEditFolderUid(client, conversationId, userId, uid)
    } else if (state.folderPickerReturnBranch === 'create_alert_rule') {
      await applyAlertFolderUid(client, conversationId, userId, uid)
    } else if (state.folderPickerReturnBranch === 'create_alert_rule_optional') {
      await applyAlertFolderUidOptional(client, conversationId, userId, uid)
    }
  }
  return handleFolderPicker(client, conversationId, userId, step, input, onSelected)
}

const handlePanelCreatorBranch = async (
  client: Client,
  conversationId: string,
  userId: string,
  step: string,
  input: string
) => {
  const state = await getFlowState(client, conversationId)
  const onPanelAdded = async (panel: object | null) => {
    if (state.callerBranch === 'create_dashboard') await applyPanel(client, conversationId, userId, panel)
  }
  return handlePanelCreator(client, conversationId, userId, step, input, onPanelAdded)
}

const handlePanelGridBranch = async (
  client: Client,
  conversationId: string,
  userId: string,
  step: string,
  input: string
) => {
  const state = await getFlowState(client, conversationId)
  const onDone =
    state.callerBranch === 'edit_dashboard'
      ? () => resumeEditPanel(client, conversationId, userId)
      : () => resumePanelCreator(client, conversationId, userId)
  return handlePanelGrid(client, conversationId, userId, step, input, onDone)
}

const buildDatasourceReturnCallback = (
  callerBranch: string | undefined,
  client: Client,
  conversationId: string,
  userId: string
) => {
  if (callerBranch === 'edit_dashboard') return () => resumeEditPanel(client, conversationId, userId)
  if (callerBranch === 'create_alert_rule') return () => resumeAlertRuleFromQuery(client, conversationId, userId)
  if (callerBranch === 'create_alert_rule_optional') {
    return () => resumeAlertRuleFromQueryOptional(client, conversationId, userId)
  }
  if (callerBranch === 'create_alert_rule_labels') {
    return () => resumeCreateAlertRuleOptional(client, conversationId, userId)
  }
  return () => resumePanelCreator(client, conversationId, userId)
}

const handlePanelDatasourceBranch = async (
  client: Client,
  conversationId: string,
  userId: string,
  step: string,
  input: string
) => {
  const state = await getFlowState(client, conversationId)
  const onDone = buildDatasourceReturnCallback(state.callerBranch, client, conversationId, userId)
  return handlePanelDatasource(client, conversationId, userId, step, input, onDone)
}

const handleQueryExplorerBranch = async (
  client: Client,
  conversationId: string,
  userId: string,
  step: string,
  input: string
) => {
  const state = await getFlowState(client, conversationId)
  const resume = buildDatasourceReturnCallback(state.callerBranch, client, conversationId, userId)
  return handleQueryExplorer(
    client,
    conversationId,
    userId,
    step,
    input,
    () => resumeToQueryPrompt(client, conversationId, userId),
    async (query) => {
      await applyQuery(client, conversationId, query)
      await resume()
    }
  )
}

const handleNotificationPolicyExplorerBranch = async (
  client: Client,
  logger: Logger,
  conversationId: string,
  userId: string,
  step: string,
  input: string
) => {
  const state = await getFlowState(client, conversationId)
  const handlers = {
    onSelected: (labels: Record<string, string>) => applyLabelsFromPolicy(client, conversationId, userId, labels),
    onBack: buildDatasourceReturnCallback(state.callerBranch, client, conversationId, userId),
  }
  return handleNotificationPolicyExplorer(client, logger, conversationId, userId, step, input, handlers)
}

const handleContactPointPickerBranch = async (
  client: Client,
  conversationId: string,
  userId: string,
  step: string,
  input: string
) => {
  const state = await getFlowState(client, conversationId)
  const onSelected = async (name: string) => {
    if (state.contactPointPickerReturnBranch === 'create_alert_rule') {
      await applyContactPointToAlertRule(client, conversationId, userId, name)
    } else if (state.contactPointPickerReturnBranch === 'notif_policy') {
      await applyContactPointToNotifPolicy(client, conversationId, userId, name)
    }
  }
  return handleContactPointPicker(client, conversationId, userId, step, input, onSelected)
}

const routePanelBranch = (
  client: Client,
  conversationId: string,
  userId: string,
  branch: string,
  step: string,
  input: string
) => {
  if (branch === 'folder_picker') return handleFolderPickerBranch(client, conversationId, userId, step, input)
  if (branch === 'panel_creator') return handlePanelCreatorBranch(client, conversationId, userId, step, input)
  if (branch === 'panel_grid') return handlePanelGridBranch(client, conversationId, userId, step, input)
  if (branch === 'panel_datasource') return handlePanelDatasourceBranch(client, conversationId, userId, step, input)
  return handleQueryExplorerBranch(client, conversationId, userId, step, input)
}

const routeMessage = async (
  client: Client,
  logger: Logger,
  conversationId: string,
  userId: string,
  branch: string,
  step: string,
  input: string
) => {
  if (!branch) {
    await goToMainMenu(client, conversationId, userId)
    return
  }
  if (branch === 'main') return handleMain(client, conversationId, userId, input)
  if (branch === 'get_dashboard') return handleGetDashboard(client, conversationId, userId, input)
  if (branch === 'get_dashboard_select') return handleGetDashboardSelect(client, conversationId, userId, input)
  if (branch === 'edit_dashboard_uid') return handleEditDashboardUidInput(client, conversationId, userId, input)
  if (branch === 'edit_dashboard_uid_select') return handleEditDashboardUidSelect(client, conversationId, userId, input)
  if (branch === 'edit_dashboard') return handleEditDashboard(client, conversationId, userId, step, input)
  if (branch === 'create_dashboard') return handleCreateDashboard(client, conversationId, userId, step, input)
  if (branch === 'create_alert_rule') return handleCreateAlertRule(client, logger, conversationId, userId, step, input)
  if (branch === 'manage_alert_rules') return handleManageAlertRules(client, conversationId, userId, step, input)
  if (branch === 'notifications') return handleNotifications(client, conversationId, userId, input)
  if (branch === 'notif_policy_explorer') {
    return handleNotificationPolicyExplorerBranch(client, logger, conversationId, userId, step, input)
  }
  if (branch === 'contact_point_picker') {
    return handleContactPointPickerBranch(client, conversationId, userId, step, input)
  }
  return routePanelBranch(client, conversationId, userId, branch, step, input)
}

bot.on.message('*', async (props) => {
  if (props.message.type !== 'text') return
  const {
    conversation: { id: conversationId },
    ctx: { botId: userId },
    client,
    logger,
  } = props
  const branch = props.conversation.tags?.branch ?? ''
  const raw = props.message.payload.text.trim()
  const state = await getFlowState(client, conversationId)
  const matchedControl = state.activeControls?.find((c) => c.label === raw)
  const input = matchedControl ? matchedControl.value : raw
  await routeMessage(client, logger, conversationId, userId, branch, props.conversation.tags?.step ?? '', input)
})

const REFRESH_COOLDOWN_MS = 5000

bot.on.event('my_handle-1/grafana:alertFired', async (props) => {
  const {
    client,
    logger,
    event,
    ctx: { botId: userId },
  } = props
  const { botpressId, alertName, status } = event.payload

  if (!botpressId) {
    logger.warn('alertFired received without botpressId, ignoring')
    return
  }

  const { rows } = await client.findTableRows({ table: 'alertSubscriptionsTable', filter: { botpressId } })
  const conversationId = rows[0]?.conversationId
  if (!conversationId) {
    logger.warn(`No conversation found for botpressId ${botpressId}, ignoring`)
    return
  }

  await client.createTableRows({
    table: 'alertNotificationsTable',
    rows: [{ notifId: randomUUID(), conversationId, alertName, status, receivedAt: new Date().toISOString() }],
  })

  const notifState = await getNotifState(client, conversationId)
  const lastRefreshed = notifState.lastRefreshedAt ? new Date(notifState.lastRefreshedAt).getTime() : 0
  if (Date.now() - lastRefreshed < REFRESH_COOLDOWN_MS) return

  await setNotifState(client, conversationId, { lastRefreshedAt: new Date().toISOString() })

  const { conversation } = await client.getConversation({ id: conversationId })
  if (conversation.tags?.branch === 'main') {
    await reply(client, conversationId, userId, 'You have new notifications.')
  } else if (conversation.tags?.branch === 'notifications') {
    await reply(client, conversationId, userId, 'You have new unread notifications. Reload to see them.')
  }
})
