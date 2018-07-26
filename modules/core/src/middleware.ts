export type MiddlewareType = 'incoming' | 'outgoing'

export type MiddlewareEvent = {
  plateform: string
  text: string
  raw: string
  type: MiddlewareType
}

export class Middleware {
  name: string
  handler: Function
  type: MiddlewareType
  order: number
  enabled: boolean

  constructor() {}
}
