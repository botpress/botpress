import { createAlertRule } from './actions/create-alert-rule'
import { createContactPoint } from './actions/create-contact-point'
import { createDashboard } from './actions/create-dashboard'
import { createFolder } from './actions/create-folder'
import { createNotificationPolicy } from './actions/create-notification-policy'
import { deleteAlertRule } from './actions/delete-alert-rule'
import { deleteContactPoint } from './actions/delete-contact-point'
import { deleteDashboard } from './actions/delete-dashboard'
import { deleteFolder } from './actions/delete-folder'
import { deleteNotificationPolicy } from './actions/delete-notification-policy'
import { editDashboard } from './actions/edit-dashboard'
import { editDashboardPanel } from './actions/edit-dashboard-panel'
import { editDefaultNotificationPolicy } from './actions/edit-default-notification-policy'
import { editNotificationPolicy } from './actions/edit-notification-policy'
import { getAlertRule } from './actions/get-alert-rule'
import { getDashboard } from './actions/get-dashboard'
import { listAlertRules } from './actions/list-alert-rules'
import { listContactPoints } from './actions/list-contact-points'
import { listDashboards } from './actions/list-dashboards'
import { listDatasources } from './actions/list-datasources'
import { listFolders } from './actions/list-folders'
import { listLabelNames } from './actions/list-label-names'
import { listLabelValues } from './actions/list-label-values'
import { listMetricNames } from './actions/list-metric-names'
import { listNotificationPolicies } from './actions/list-notification-policies'
import { queryMetrics } from './actions/query-metrics'
import { ActionDefinitions } from './actions/types'

export const actions = {
  createDashboard,
  getDashboard,
  listDashboards,
  editDashboard,
  editDashboardPanel,
  deleteDashboard,
  createAlertRule,
  getAlertRule,
  listAlertRules,
  deleteAlertRule,
  createNotificationPolicy,
  listNotificationPolicies,
  deleteNotificationPolicy,
  editNotificationPolicy,
  editDefaultNotificationPolicy,
  listContactPoints,
  createContactPoint,
  deleteContactPoint,
  listDatasources,
  queryMetrics,
  listMetricNames,
  listLabelNames,
  listLabelValues,
  listFolders,
  createFolder,
  deleteFolder,
} satisfies ActionDefinitions
