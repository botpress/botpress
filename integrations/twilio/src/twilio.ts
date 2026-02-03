import { Twilio } from 'twilio'
import * as bp from '.botpress'

export type TwilioChannel = 'sms/mms' | 'rcs' | 'whatsapp' | 'messenger'

export function getTwilioClient(ctx: bp.Context): Twilio {
  return new Twilio(ctx.configuration.accountSID, ctx.configuration.authToken)
}
