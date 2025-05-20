export * from '../consts'

export const LET_BOT_HANDLE_EVENT = { stop: false } as const // let the event / message propagate to the bot
export const STOP_EVENT_HANDLING = { stop: true } as const // prevent the event / message from propagating to the bot
