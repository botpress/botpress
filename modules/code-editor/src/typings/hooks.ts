export const HOOK_SIGNATURES = {
  before_incoming_middleware: 'async function hook(bp: typeof sdk, event: sdk.IO.IncomingEvent)',
  after_incoming_middleware: 'async function hook(bp: typeof sdk, event: sdk.IO.IncomingEvent)',
  before_outgoing_middleware: 'async function hook(bp: typeof sdk, event: sdk.IO.IncomingEvent)',
  after_event_processed: 'async function hook(bp: typeof sdk, event: sdk.IO.IncomingEvent)',
  before_suggestions_election:
    'async function hook(bp: typeof sdk, sessionId: string, event: sdk.IO.IncomingEvent, suggestions: sdk.IO.Suggestion[])',
  after_server_start: 'async function hook(bp: typeof sdk)',
  after_bot_mount: 'async function hook(bp: typeof sdk, botId: string)',
  after_bot_unmount: 'async function hook(bp: typeof sdk, botId: string)',
  before_session_timeout: 'async function hook(bp: typeof sdk, event: sdk.IO.IncomingEvent)',
  on_incident_status_changed: 'async function hook(bp: typeof sdk, incident: sdk.Incident)',
  before_bot_import: 'async function hook(bp: typeof sdk, botId: string, tmpFolder: string, hookResult: object)',
  on_stage_request:
    'async function hook(bp: typeof sdk, bot: sdk.BotConfig, users: Partial<sdk.AuthUser[]>, pipeline: sdk.Pipeline, hookResult: any)',
  after_stage_changed:
    'async function hook(bp: typeof sdk, previousBotConfig: sdk.BotConfig, bot: sdk.BotConfig, users: Partial<sdk.AuthUser[]>, pipeline: sdk.Pipeline)'
}

export const BOT_SCOPED_HOOKS = [
  'before_incoming_middleware',
  'after_incoming_middleware',
  'before_outgoing_middleware',
  'after_event_processed',
  'before_suggestions_election',
  'before_session_timeout'
]
