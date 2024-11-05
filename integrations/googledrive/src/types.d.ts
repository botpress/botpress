import { google, drive_v3 } from 'googleapis'
import { fileSchema } from './schemas'
import { z } from '@botpress/sdk'

export type GoogleDriveClient = drive_v3.Drive
export type UnvalidatedGoogleDriveFile = drive_v3.Schema$File
export type UnvalidatedGoogleDriveDrive = drive_v3.Schema$Drive

export type GoogleDriveFile = UnvalidatedGoogleDriveFile & {
  id: string // Non null
  name: string // Non null
  parentId?: string // Support for a single parent only, optionnal
  mimeType: string
}
export type File = z.infer<typeof fileSchema>

export type GoogleDriveDrive = UnvalidatedGoogleDriveDrive & {
  id: string // Non null
}

export type GoogleOAuth2Client = InstanceType<(typeof google.auth)['OAuth2']>
