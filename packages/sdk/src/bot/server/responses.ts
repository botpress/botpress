export const SUCCESS_RESPONSE = { status: 200 } as const
export const SUCCESS_STOPPED_RESPONSE = { status: 200, body: JSON.stringify({ stopped: true }) } as const
