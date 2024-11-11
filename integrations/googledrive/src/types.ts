import { z } from '@botpress/sdk'
import { google, drive_v3 } from 'googleapis'
import {
  baseGenericFileSchema,
  baseNormalFileSchema,
  baseFolderFileSchema,
  baseShortcutFileSchema,
  fileSchema,
  folderSchema,
  commonFileAttrSchema,
  listFileOutputSchema,
  listFolderOutputSchema,
  createFileArgSchema,
  updateFileArgSchema,
  uploadFileDataArgSchema,
  downloadFileDataArgSchema,
  downloadFileDataOutputSchema,
} from './schemas'

export type GoogleDriveClient = drive_v3.Drive
export type UnvalidatedGoogleDriveFile = drive_v3.Schema$File
export type UnvalidatedGoogleDriveDrive = drive_v3.Schema$Drive

export type CommonFileAttr = z.infer<typeof commonFileAttrSchema>
export type BaseGenericFile = z.infer<typeof baseGenericFileSchema>
export type BaseNormalFile = z.infer<typeof baseNormalFileSchema>
export type BaseFolderFile = z.infer<typeof baseFolderFileSchema>
export type BaseShortcutFile = z.infer<typeof baseShortcutFileSchema>
export type NonDiscriminatedGenericFile = BaseNormalFile | BaseFolderFile | BaseShortcutFile

export type File = z.infer<typeof fileSchema>
export type Folder = z.infer<typeof folderSchema>

export type ListFileOutput = z.infer<typeof listFileOutputSchema>
export type ListFolderOutput = z.infer<typeof listFolderOutputSchema>
export type CreateFileArgs = z.infer<typeof createFileArgSchema>
export type UpdateFileArgs = z.infer<typeof updateFileArgSchema>
export type UploadFileDataArgs = z.infer<typeof uploadFileDataArgSchema>
export type DownloadFileDataArgs = z.infer<typeof downloadFileDataArgSchema>
export type DownloadFileDataOutput = z.infer<typeof downloadFileDataOutputSchema>

export type GoogleOAuth2Client = InstanceType<(typeof google.auth)['OAuth2']>
