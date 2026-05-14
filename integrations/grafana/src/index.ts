import { createAlertRuleAction, getAlertRuleAction, listAlertRulesAction, deleteAlertRuleAction } from './actions/alerts'
import { listContactPointsAction, createContactPointAction, deleteContactPointAction } from './actions/contactPoints'
import { createDashboardAction, editDashboardAction, editDashboardPanelAction, getDashboardAction, listDashboardsAction, deleteDashboardAction } from './actions/dashboards'
import { listDatasourcesAction, queryMetricsAction, listMetricNamesAction, listLabelNamesAction, listLabelValuesAction } from './actions/datasources'
import { createFolderAction, listFoldersAction, deleteFolderAction } from './actions/folders'
import { createNotificationPolicyAction, listNotificationPoliciesAction, editNotificationPolicyAction, deleteNotificationPolicyAction, editDefaultNotificationPolicyAction } from './actions/notifications'
import { handler } from './handler'
import { register } from './register'
import * as bp from '.botpress'

export default new bp.Integration({
  register,
  unregister: async () => {},
  actions: {
    createDashboard: createDashboardAction,
    editDashboard: editDashboardAction,
    editDashboardPanel: editDashboardPanelAction,
    getDashboard: getDashboardAction,
    listDashboards: listDashboardsAction,
    deleteDashboard: deleteDashboardAction,
    createAlertRule: createAlertRuleAction,
    getAlertRule: getAlertRuleAction,
    listAlertRules: listAlertRulesAction,
    deleteAlertRule: deleteAlertRuleAction,
    createFolder: createFolderAction,
    listFolders: listFoldersAction,
    deleteFolder: deleteFolderAction,
    createNotificationPolicy: createNotificationPolicyAction,
    listNotificationPolicies: listNotificationPoliciesAction,
    editNotificationPolicy: editNotificationPolicyAction,
    deleteNotificationPolicy: deleteNotificationPolicyAction,
    editDefaultNotificationPolicy: editDefaultNotificationPolicyAction,
    listDatasources: listDatasourcesAction,
    listContactPoints: listContactPointsAction,
    createContactPoint: createContactPointAction,
    deleteContactPoint: deleteContactPointAction,
    queryMetrics: queryMetricsAction,
    listMetricNames: listMetricNamesAction,
    listLabelNames: listLabelNamesAction,
    listLabelValues: listLabelValuesAction,
  },
  channels: {},
  handler
})
