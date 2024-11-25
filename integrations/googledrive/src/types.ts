import { z } from '@botpress/sdk'
import { google, drive_v3 } from 'googleapis'
import {
  baseDiscriminatedFileSchema,
  baseNormalFileSchema,
  baseFolderFileSchema,
  baseShortcutFileSchema,
  fileSchema,
  folderSchema,
  commonFileAttrSchema,
  listFilesOutputSchema,
  listFoldersOutputSchema,
  createFileArgSchema,
  updateFileArgSchema,
  uploadFileDataArgSchema,
  downloadFileDataArgSchema,
  downloadFileDataOutputSchema,
  listItemsOutputSchema,
  listItemsInputSchema,
  fileChannelSchema,
  notificationSchema,
  fileTypesUnionSchema,
  baseChannelSchema,
  genericFileSchema,
  shortcutSchema,
} from './schemas'

type Overwrite<T, NewT> = Omit<T, keyof NewT> & NewT

export type GoogleDriveClient = drive_v3.Drive
export type UnvalidatedGoogleDriveFile = drive_v3.Schema$File
export type UnvalidatedGoogleDriveChannel = drive_v3.Schema$Channel

export type CommonFileAttr = z.infer<typeof commonFileAttrSchema>
export type BaseDiscriminatedFile = z.infer<typeof baseDiscriminatedFileSchema>
export type BaseNormalFile = z.infer<typeof baseNormalFileSchema>
export type BaseFolderFile = z.infer<typeof baseFolderFileSchema>
export type BaseShortcutFile = z.infer<typeof baseShortcutFileSchema>
export type BaseGenericFileUnion = BaseNormalFile | BaseFolderFile | BaseShortcutFile
export type BaseFileChannel = z.infer<typeof baseChannelSchema>
export type FileType = z.infer<typeof fileTypesUnionSchema>
export type Notification = z.infer<typeof notificationSchema>

export type File = z.infer<typeof fileSchema>
export type Folder = z.infer<typeof folderSchema>
export type Shortcut = z.infer<typeof shortcutSchema>
export type GenericFile = z.infer<typeof genericFileSchema>
export type FileChannel = z.infer<typeof fileChannelSchema>

export type ListItemsInput = z.infer<typeof listItemsInputSchema>
export type ListItemsOutput<T> = Overwrite<z.infer<typeof listItemsOutputSchema>, { items: T[] }>
export type ListFilesOutput = z.infer<typeof listFilesOutputSchema>
export type ListFoldersOutput = z.infer<typeof listFoldersOutputSchema>
export type CreateFileArgs = z.infer<typeof createFileArgSchema>
export type UpdateFileArgs = z.infer<typeof updateFileArgSchema>
export type UploadFileDataArgs = z.infer<typeof uploadFileDataArgSchema>
export type DownloadFileDataArgs = z.infer<typeof downloadFileDataArgSchema>
export type DownloadFileDataOutput = z.infer<typeof downloadFileDataOutputSchema>

export type GoogleOAuth2Client = InstanceType<(typeof google.auth)['OAuth2']>
