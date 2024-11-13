import * as sdk from '@botpress/sdk'
import { google } from 'googleapis'
import * as bp from '.botpress'

type GoogleOAuth2Client = InstanceType<(typeof google.auth)['OAuth2']>

const OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
]

export const getAuthenticatedOAuth2Client = async ({
  ctx,
}: {
  ctx: bp.Context
  client: bp.Client
}): Promise<GoogleOAuth2Client> => {
  if (ctx.configurationType === 'serviceAccountKey') {
    return new google.auth.JWT({
      email: ctx.configuration.clientEmail,
      key: ctx.configuration.privateKey.split(String.raw`\n`).join('\n'),
      scopes: OAUTH_SCOPES,
    })
  }

  throw new sdk.RuntimeError('OAuth not yet implemented for this integration')
}
