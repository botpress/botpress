import { ClientMessage } from 'whatsapp-api-js/types'

export type InteractivePayload = {
  type: string
  header?: unknown
  body?: { text: string }
  footer?: { text: string }
  action: unknown
}

/**
 * A `ClientMessage` that emits an arbitrary `interactive` payload via `toJSON()`.
 *
 * `whatsapp-api-js` doesn't model the December 2025 Interactive Media Carousel,
 * and its `Interactive` constructor refuses image headers for `cta_url` actions
 * (lib/messages/interactive.js:51-54). For both cases we build the JSON directly.
 *
 * The lib's `sendMessage` does `JSON.stringify(request)` after setting
 * `request.interactive = this`, so a `toJSON()` override is enough — the payload
 * is serialized verbatim without any of the lib's validation.
 */
export class RawInteractiveMessage extends ClientMessage {
  public constructor(private readonly _payload: InteractivePayload) {
    super()
  }

  public get _type(): 'interactive' {
    return 'interactive'
  }

  public toJSON() {
    return this._payload
  }
}
