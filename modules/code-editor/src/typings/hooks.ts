export const HOOK_SIGNATURES = {
  before_incoming_middleware: 'async function action(bp: typeof sdk, event: sdk.IO.IncomingEvent)',
  after_incoming_middleware: 'async function action(bp: typeof sdk, event: sdk.IO.IncomingEvent)',
  before_outgoing_middleware: 'async function action(bp: typeof sdk, event: sdk.IO.IncomingEvent)',
  after_event_processed: 'async function action(bp: typeof sdk, event: sdk.IO.IncomingEvent)',
  before_suggestions_election:
    'async function action(bp: typeof sdk, sessionId: string, event: sdk.IO.IncomingEvent, suggestions: sdk.IO.Suggestion[])',
  after_server_start: 'async function action(bp: typeof sdk)',
  after_bot_mount: 'async function action(bp: typeof sdk, botId: string)',
  after_bot_unmount: 'async function action(bp: typeof sdk, botId: string)',
  before_session_timeout: 'async function action(bp: typeof sdk, event: sdk.IO.IncomingEvent)',
  on_incident_status_changed: 'async function action(bp: typeof sdk, incident: sdk.Incident)',
  before_bot_import: 'async function action(bp: typeof sdk, botId: string, tmpFolder: string, hookResult: object)',
  on_stage_request:
    'async function action(bp: typeof sdk, bot: sdk.BotConfig, users: Partial<sdk.AuthUser[]>, pipeline: sdk.Pipeline, hookResult: any)',
  after_stage_changed:
    'async function action(bp: typeof sdk, previousBotConfig: sdk.BotConfig, bot: sdk.BotConfig, users: Partial<sdk.AuthUser[]>, pipeline: sdk.Pipeline)'
}
