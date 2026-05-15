import { z } from '@botpress/sdk'

export const dashboardFlow = {
  type: 'conversation' as const,
  schema: z.object({
    dashboards: z.array(z.object({ name: z.string(), title: z.string() })).optional(),
    selectedDashboard: z.object({ name: z.string(), title: z.string(), uid: z.string() }).optional(),
    folders: z.array(z.object({ uid: z.string().optional(), title: z.string().optional() })).optional(),
    folderPickerReturnBranch: z.string().optional(),
    createFolderForm: z
      .object({
        title: z.string().optional(),
        uid: z.string().optional(),
        parentUid: z.string().optional(),
        description: z.string().optional(),
      })
      .optional(),
    panelForm: z.any().optional(),
    callerBranch: z.string().optional(),
    contactPointPickerReturnBranch: z.string().optional(),
    datasourceList: z
      .array(
        z.object({
          uid: z.string().optional(),
          name: z.string().optional(),
          type: z.string().optional(),
          isDefault: z.boolean().optional(),
        })
      )
      .optional(),
    contactPointList: z
      .array(
        z.object({
          uid: z.string().optional(),
          name: z.string().optional(),
          type: z.string(),
        })
      )
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
      .optional(),
    dashboardJson: z.any().optional(),
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
      .optional(),
    activeControls: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
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
      .optional(),
  }),
}
