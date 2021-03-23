export class RealTimePayload {
  readonly eventName: string
  readonly payload: any

  constructor(eventName: string, payload: any) {
    this.eventName = eventName.toLowerCase()
    this.payload = payload
  }

  /**
   * Creates a payload to be send to a unique visitor.
   * A visitor is essentially a unique socket user surfing a Botpress-enabled interface.
   * Interfaces include the Botpress Dashboard and the Botpress Webchat.
   * @param visitorId The ID of the visitor, on the Webchat this is the channel-web `userId`
   */
  static forVisitor(visitorId: string, eventName: string, payload: any): RealTimePayload {
    if (!eventName.toLowerCase().startsWith('guest.')) {
      eventName = `guest.${eventName}`
    }

    return new RealTimePayload(eventName, {
      ...payload,
      __room: `visitor:${visitorId}`
    })
  }

  public static forAdmins(eventName: string, payload: any): RealTimePayload {
    return new RealTimePayload(eventName, payload)
  }
}
