import { google, drive_v3 } from 'googleapis'

export type GoogleDriveClient = drive_v3.Drive
export type UnvalidatedGoogleDriveFile = drive_v3.Schema$File
export type UnvalidatedGoogleDriveDrive = drive_v3.Schema$Drive

export type GoogleDriveFile = UnvalidatedGoogleDriveFile & {
    id: string // Non null
    name: string // Non null
    parentId?: string // Support for a single parent only, optionnal
}
export type GoogleDriveDrive = UnvalidatedGoogleDriveDrive & {
    id: string // Non null
}

export type GoogleOAuth2Client = InstanceType<(typeof google.auth)['OAuth2']>
