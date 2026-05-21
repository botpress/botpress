import { z } from '@botpress/sdk'

export const dashboardFlow = {
  type: 'conversation' as const,
  schema: z.object({
    dashboards: z
      .array(z.object({ name: z.string(), title: z.string() }))
      .title('Dashboards')
      .describe('List of dashboards available in the Grafana workspace')
      .optional(),
    selectedDashboard: z
      .object({ name: z.string(), title: z.string(), uid: z.string() })
      .title('Selected Dashboard')
      .describe('The dashboard currently being viewed or edited')
      .optional(),
    folders: z
      .array(z.object({ uid: z.string().optional(), title: z.string().optional() }))
      .title('Folders')
      .describe('List of Grafana folders available for selection')
      .optional(),
    folderPickerReturnBranch: z
      .string()
      .title('Folder Picker Return Branch')
      .describe('The branch to return to after the folder picker completes')
      .optional(),
    createFolderForm: z
      .object({
        title: z.string().optional(),
        uid: z.string().optional(),
        parentUid: z.string().optional(),
        description: z.string().optional(),
      })
      .title('Create Folder Form')
      .describe('Form data for creating a new Grafana folder')
      .optional(),
    panelForm: z.any().title('Panel Form').describe('Form data for creating or editing a dashboard panel').optional(),
    callerBranch: z
      .string()
      .title('Caller Branch')
      .describe('The branch that initiated a sub-flow, used to resume after completion')
      .optional(),
    contactPointPickerReturnBranch: z
      .string()
      .title('Contact Point Picker Return Branch')
      .describe('The branch to return to after the contact point picker completes')
      .optional(),
    datasourceList: z
      .array(
        z.object({
          uid: z.string().optional(),
          name: z.string().optional(),
          type: z.string().optional(),
          isDefault: z.boolean().optional(),
        })
      )
      .title('Datasource List')
      .describe('List of Grafana datasources available for panel and query configuration')
      .optional(),
    contactPointList: z
      .array(
        z.object({
          uid: z.string().optional(),
          name: z.string().optional(),
          type: z.string(),
        })
      )
      .title('Contact Point List')
      .describe('List of Grafana alerting contact points available for selection')
      .optional(),
    alertRuleList: z
      .array(
        z.object({
          uid: z.string().optional(),
          title: z.string().optional(),
          ruleGroup: z.string().optional(),
          folderUID: z.string().optional(),
          labels: z.record(z.string()).optional(),
        })
      )
      .title('Alert Rule List')
      .describe('List of Grafana alert rules available for management')
      .optional(),
    notificationPolicyList: z
      .array(
        z.object({
          receiver: z.string().optional(),
          matchers: z.any().optional(),
          object_matchers: z.any().optional(),
          group_by: z.array(z.string()).optional(),
          continue: z.boolean().optional(),
        })
      )
      .title('Notification Policy List')
      .describe('List of Grafana notification policy routes available for management')
      .optional(),
    notificationPolicyForm: z
      .object({
        receiver: z.string().optional(),
        matchers: z
          .array(
            z.object({
              name: z.string(),
              operator: z.enum(['=', '!=', '=~', '!~']),
              value: z.string(),
            })
          )
          .optional(),
        continue: z.boolean().optional(),
        group_by: z.array(z.string()).optional(),
        group_wait: z.string().optional(),
        group_interval: z.string().optional(),
        repeat_interval: z.string().optional(),
        mute_time_intervals: z.array(z.string()).optional(),
        active_time_intervals: z.array(z.string()).optional(),
      })
      .title('Notification Policy Form')
      .describe('Form data for creating a new Grafana notification policy route')
      .optional(),
    dashboardJson: z
      .any()
      .title('Dashboard JSON')
      .describe('Raw Grafana dashboard JSON used during panel editing')
      .optional(),
    editDashboardForm: z
      .object({
        title: z.string().optional(),
        tags: z.array(z.string()).optional(),
        timezone: z.string().optional(),
        timeFrom: z.string().optional(),
        timeTo: z.string().optional(),
        refresh: z.string().optional(),
        folderUid: z.string().optional(),
      })
      .title('Edit Dashboard Form')
      .describe('Form data for editing an existing dashboard settings')
      .optional(),
    explorerState: z
      .object({
        metric: z.string().optional(),
        currentParams: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
        selectedLabelName: z.string().optional(),
        metricsList: z.array(z.string()).optional(),
        labelNamesList: z.array(z.string()).optional(),
        labelValuesList: z.array(z.string()).optional(),
      })
      .title('Explorer State')
      .describe('State for the interactive metric and label explorer used during query building')
      .optional(),
    alertRuleForm: z
      .object({
        title: z.string().optional(),
        folderUID: z.string().optional(),
        datasourceUid: z.string().optional(),
        query: z.string().optional(),
        reducer: z.enum(['last', 'mean', 'max', 'min']).optional(),
        thresholdType: z.enum(['gt', 'lt', 'gte', 'lte']).optional(),
        thresholdValue: z.number().optional(),
        forDuration: z.string().optional(),
        ruleGroup: z.string().optional(),
        receiver: z.string().optional(),
        labels: z.record(z.string()).optional(),
      })
      .title('Alert Rule Form')
      .describe('Form data for creating a new Grafana alert rule')
      .optional(),
    activeControls: z
      .array(z.object({ label: z.string(), value: z.string() }))
      .title('Active Controls')
      .describe('The set of menu controls currently displayed to the user')
      .optional(),
    createForm: z
      .object({
        uid: z.string().optional(),
        title: z.string().optional(),
        tags: z.array(z.string()).optional(),
        timezone: z.string().optional(),
        editable: z.boolean().optional(),
        graphTooltip: z.number().optional(),
        timeFrom: z.string().optional(),
        timeTo: z.string().optional(),
        refresh: z.string().optional(),
        folderUid: z.string().optional(),
        panels: z.array(z.any()).optional(),
      })
      .title('Create Dashboard Form')
      .describe('Form data for creating a new Grafana dashboard')
      .optional(),
  }),
}
