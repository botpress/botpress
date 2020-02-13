import { IO } from 'botpress/sdk'

export enum LoggerLevel {
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
  Debug = 'debug'
}

export enum LogLevel {
  PRODUCTION = 0,
  DEV = 1,
  DEBUG = 2
}

export enum NodeActionType {
  RenderElement = 'render',
  RunAction = 'run',
  RenderText = 'say'
}

export const WellKnownFlags: typeof IO.WellKnownFlags = {
  SKIP_DIALOG_ENGINE: Symbol.for('skipDialogEngine'),
  SKIP_QNA_PROCESSING: Symbol.for('avoidQnaProcessing'),
  SKIP_NATIVE_NLU: Symbol.for('skipNativeNLU'),
  FORCE_PERSIST_STATE: Symbol.for('forcePersistState')
}

export enum AnalyticsMethod {
  IncrementDaily = 'daily',
  IncrementTotal = 'total',
  Replace = 'replace'
}

export enum AnalyticsMetric {
  SessionsCount = 'sessions_count',
  MsgReceivedCount = 'msg_received_count',
  MsgSentCount = 'msg_sent_count',
  MsgSentQnaCount = 'msg_sent_qna_count',
  MsgNluNone = 'msg_nlu_none',
  GoalsStartedCount = 'goals_started_count',
  GoalsCompletedCount = 'goals_completed_count',
  GoalsFailedCount = 'goals_failed_count',
  NewUsersCount = 'new_users_count',
  TotalUsers = 'total_users_count',
  ActiveUsers = 'active_users_count',
  SessionsStartNluNone = 'sessions_start_nlu_none',
  FeedbackPositiveQna = 'feedback_positive_qna',
  FeedbackNegativeQna = 'feedback_negative_qna',
  FeedbackPositiveGoal = 'feedback_positive_goal',
  FeedbackNegativeGoal = 'feedback_negative_goal'
}
