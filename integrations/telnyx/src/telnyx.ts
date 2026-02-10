import { Telnyx } from 'telnyx'
import * as bp from '.botpress'

export function getTelnyxClient(ctx: bp.Context): Telnyx {
  return new Telnyx(ctx.configuration.apiKey)
}