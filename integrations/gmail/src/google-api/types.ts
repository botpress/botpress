import { google } from 'googleapis'

export type GmailClient = ReturnType<typeof google.gmail>
export type GoogleOAuth2Client = InstanceType<(typeof google.auth)['OAuth2']>
export type GoogleCerts = Awaited<ReturnType<GoogleOAuth2Client['getFederatedSignonCertsAsync']>>['certs']
export type LoginTicketPayload = ReturnType<
  Awaited<ReturnType<GoogleOAuth2Client['verifySignedJwtWithCertsAsync']>>['getPayload']
>
