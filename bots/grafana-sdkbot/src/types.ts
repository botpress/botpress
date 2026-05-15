export type Dashboard = { name: string; title: string; uid: string }
export type Panel = { title?: string }
export type DashboardData = { dashboard?: { title?: string; uid?: string; panels?: Panel[] } }

export type ListControl = { label: string; value: string }

export type PanelForm = {
  type?: 'text' | 'timeseries'
  title?: string
  description?: string
  id?: number
  gridPosH?: number
  gridPosW?: number
  gridPosX?: number
  gridPosY?: number
  content?: string
  mode?: 'markdown' | 'html' | 'code'
  datasourceUid?: string
  query?: string
}

export type CreateFolderForm = {
  title?: string
  uid?: string
  parentUid?: string
  description?: string
}

export type AlertRuleForm = {
  title?: string
  folderUID?: string
  datasourceUid?: string
  query?: string
  reducer?: 'last' | 'mean' | 'max' | 'min'
  thresholdType?: 'gt' | 'lt' | 'gte' | 'lte'
  thresholdValue?: number
  forDuration?: string
  ruleGroup?: string
  receiver?: string
  labels?: Record<string, string>
}

export type EditDashboardForm = {
  title?: string
  tags?: string[]
  timezone?: string
  timeFrom?: string
  timeTo?: string
  refresh?: string
  folderUid?: string
}

export type CreateForm = {
  uid?: string
  title?: string
  tags?: string[]
  timezone?: string
  editable?: boolean
  graphTooltip?: number
  timeFrom?: string
  timeTo?: string
  refresh?: string
  folderUid?: string
  panels?: object[]
}

export type Folder = { uid?: string; title?: string }
export type Datasource = { uid?: string; name?: string; type?: string; isDefault?: boolean }
export type ContactPoint = { uid?: string; name?: string; type: string }
export type NotificationPolicy = {
  receiver?: string
  matchers?: any
  object_matchers?: any
  group_by?: string[]
  continue?: boolean
}
export type NotificationPolicyMatcher = { name: string; operator: '=' | '!=' | '=~' | '!~'; value: string }
export type NotificationPolicyForm = {
  receiver?: string
  matchers?: NotificationPolicyMatcher[]
  continue?: boolean
  group_by?: string[]
  group_wait?: string
  group_interval?: string
  repeat_interval?: string
  mute_time_intervals?: string[]
  active_time_intervals?: string[]
}
export type AlertRule = {
  uid?: string
  title?: string
  ruleGroup?: string
  folderUID?: string
  labels?: Record<string, string>
}
export type Notification = {
  notifId: string
  conversationId: string
  alertName: string
  status: string
  receivedAt: string
}

export type ExplorerState = {
  metric?: string
  currentParams?: { label: string; value: string }[]
  selectedLabelName?: string
  metricsList?: string[]
  labelNamesList?: string[]
  labelValuesList?: string[]
}
