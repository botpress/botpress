import { z } from '@botpress/sdk'
import { google, drive_v3 } from 'googleapis'
import { fileSchema, folderSchema } from './schemas'

export type GoogleDriveClient = drive_v3.Drive
export type UnvalidatedGoogleDriveFile = drive_v3.Schema$File
export type UnvalidatedGoogleDriveDrive = drive_v3.Schema$Drive

// Represents a file returned by the Google API with some additional
// fields derived from the validation of other fields
export type GoogleDriveFile = {
  id: string // Non null
  name: string // Non null
  parentId?: string // Support for a single parent only, optionnal
  mimeType: string // Non null
  sizeInt?: number // Might not exist depending on file type
}

export type File = z.infer<typeof fileSchema>
export type Folder = z.infer<typeof folderSchema>

export type GoogleOAuth2Client = InstanceType<(typeof google.auth)['OAuth2']>
