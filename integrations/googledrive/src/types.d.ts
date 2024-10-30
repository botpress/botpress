import { google, drive_v3 } from 'googleapis'

export type GoogleDriveClient = drive_v3.Drive
export type UnvalidatedGoogleDriveFile = drive_v3.Schema$File
export type UnvalidatedGoogleDriveDrive = drive_v3.Schema$Drive

export type GoogleDriveFile = UnvalidatedGoogleDriveFile & { id: string }
export type GoogleDriveDrive = UnvalidatedGoogleDriveDrive & { id: string }

export type GoogleOAuth2Client = InstanceType<(typeof google.auth)['OAuth2']>
