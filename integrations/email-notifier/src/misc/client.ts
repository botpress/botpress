import { SESv2Client } from '@aws-sdk/client-sesv2'
import * as bp from '.botpress'

let _ses: SESv2Client

export const getSesClient = (): SESv2Client => {
  if (_ses) return _ses

  _ses = new SESv2Client({
    region: bp.secrets.AWS_REGION,
    credentials: {
      accessKeyId: bp.secrets.AWS_ACCESS_KEY_ID,
      secretAccessKey: bp.secrets.AWS_SECRET_ACCESS_KEY,
    },
  })

  return _ses
}
