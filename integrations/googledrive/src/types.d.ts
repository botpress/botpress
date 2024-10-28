import { google } from 'googleapis'

export type GoogleDriveClient = ReturnType<typeof google.drive>
export type GoogleOAuth2Client = InstanceType<(typeof google.auth)['OAuth2']>
