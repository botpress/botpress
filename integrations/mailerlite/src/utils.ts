import MailerLite from '@mailerlite/mailerlite-nodejs'
import { getAccessToken } from './auth'
import * as bp from '.botpress'

export const getAuthenticatedMailerLiteClient = async ({ ctx, client }: { ctx: bp.Context; client: bp.Client }) => {
  return new MailerLite({
    api_key: await getAccessToken({ ctx, client }),
  })
}
