import { ActionDefinitions } from './actions/types'

import { createDashboard } from './actions/create-dashboard'
import { getDashboard } from './actions/get-dashboard'
import { listDashboards } from './actions/list-dashboards'
import { editDashboard } from './actions/edit-dashboard'
import { editDashboardPanel } from './actions/edit-dashboard-panel'
import { deleteDashboard } from './actions/delete-dashboard'

import { createAlertRule } from './actions/create-alert-rule'
import { getAlertRule } from './actions/get-alert-rule'
import { listAlertRules } from './actions/list-alert-rules'
import { deleteAlertRule } from './actions/delete-alert-rule'

import { createNotificationPolicy } from './actions/create-notification-policy'
import { listNotificationPolicies } from './actions/list-notification-policies'
import { deleteNotificationPolicy } from './actions/delete-notification-policy'
import { editNotificationPolicy } from './actions/edit-notification-policy'
import { editDefaultNotificationPolicy } from './actions/edit-default-notification-policy'

import { listContactPoints } from './actions/list-contact-points'
import { createContactPoint } from './actions/create-contact-point'
import { deleteContactPoint } from './actions/delete-contact-point'

import { listDatasources } from './actions/list-datasources'
import { queryMetrics } from './actions/query-metrics'
import { listMetricNames } from './actions/list-metric-names'
import { listLabelNames } from './actions/list-label-names'
import { listLabelValues } from './actions/list-label-values'

import { listFolders } from './actions/list-folders'
import { createFolder } from './actions/create-folder'
import { deleteFolder } from './actions/delete-folder'

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
