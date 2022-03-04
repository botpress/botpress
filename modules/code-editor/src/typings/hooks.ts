export const HOOK_SIGNATURES = {
  before_incoming_middleware: 'function hook(bp: typeof sdk, event: sdk.IO.IncomingEvent)',
  after_incoming_middleware: 'function hook(bp: typeof sdk, event: sdk.IO.IncomingEvent)',
  before_outgoing_middleware: 'function hook(bp: typeof sdk, event: sdk.IO.OutgoingEvent)',
  after_event_processed: 'function hook(bp: typeof sdk, event: sdk.IO.IncomingEvent)',
  before_suggestions_election: `function hook(
  bp: typeof sdk,
  sessionId: string,
  event: sdk.IO.IncomingEvent,
  suggestions: sdk.IO.Suggestion[])`,
  after_server_start: 'function hook(bp: typeof sdk)',
  after_bot_mount: 'function hook(bp: typeof sdk, botId: string)',
  after_bot_unmount: 'function hook(bp: typeof sdk, botId: string)',
  before_session_timeout: 'function hook(bp: typeof sdk, event: sdk.IO.IncomingEvent)',
  before_conversation_end: 'function hook(bp: typeof sdk, event: sdk.IO.IncomingEvent)',
  on_incident_status_changed: 'function hook(bp: typeof sdk, incident: sdk.Incident)',
  before_bot_import: 'function hook(bp: typeof sdk, botId: string, tmpFolder: string, hookResult: object)',
  on_stage_request: `function hook(
  bp: typeof sdk,
  bot: sdk.BotConfig,
  users: Partial<sdk.StrategyUser[]>,
  pipeline: sdk.Pipeline,
  hookResult: any)`,
  after_stage_changed: `function hook(
  bp: typeof sdk,
  previousBotConfig: sdk.BotConfig,
  bot: sdk.BotConfig,
  users: Partial<sdk.StrategyUser[]>,
  pipeline: sdk.Pipeline)`,
  on_bot_error: 'function hook(bp: typeof sdk, botId: string, events: sdk.LoggerEntry[])'
}

export const BOT_SCOPED_HOOKS = [
  'before_incoming_middleware',
  'after_incoming_middleware',
  'before_outgoing_middleware',
  'after_event_processed',
  'before_suggestions_election',
  'before_session_timeout',
  'before_conversation_end',
  'after_bot_mount',
  'after_bot_unmount',
  'before_bot_import',
  'on_bot_error'
]
