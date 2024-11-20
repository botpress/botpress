import { RuntimeError } from '@botpress/sdk'
import { APP_GOOGLE_FOLDER_MIMETYPE, APP_GOOGLE_SHORTCUT_MIMETYPE } from './mime-types'
import { baseFolderFileSchema, baseNormalFileSchema, baseShortcutFileSchema } from './schemas'
import {
  BaseFolderFile,
  BaseGenericFile,
  BaseNormalFile,
  BaseShortcutFile,
  CommonFileAttr,
  UnvalidatedGoogleDriveFile,
  FileType,
  UnvalidatedGoogleDriveChannel,
  FileChannel,
} from './types'

export const convertNormalFileToGeneric = (file: BaseNormalFile): BaseGenericFile => {
  return {
    type: 'normal',
    ...file,
  }
}

export const convertFolderFileToGeneric = (file: BaseFolderFile): BaseGenericFile => {
  return {
    type: 'folder',
    ...file,
  }
}

export const parseChannel = (channel: UnvalidatedGoogleDriveChannel): FileChannel => {
  const { id, resourceId } = channel
  if (!resourceId) {
    throw new RuntimeError('Resource ID is missing in Schema$Channel from the API response')
  }

  if (!id) {
    throw new RuntimeError('Channel ID is missing in Schema$Channel from the API response')
  }

  return {
    id,
    resourceId,
  }
}

export const getFileTypeFromMimeType = (mimeType: string): FileType => {
  switch (mimeType) {
    case APP_GOOGLE_FOLDER_MIMETYPE:
      return 'folder'
    case APP_GOOGLE_SHORTCUT_MIMETYPE:
      return 'shortcut'
    default:
      return 'normal'
  }
}

export const parseGenericFiles = (files: UnvalidatedGoogleDriveFile[]): BaseGenericFile[] => {
  return files.map((f) => parseGenericFile(f))
}

export const parseGenericFile = (unvalidatedFile: UnvalidatedGoogleDriveFile): BaseGenericFile => {
  const { mimeType } = parseCommonFileAttr(unvalidatedFile)
  let file: BaseGenericFile
  const type = getFileTypeFromMimeType(mimeType)
  switch (type) {
    case 'folder':
      file = {
        ...parseFolderFile(unvalidatedFile),
        type,
      }
      break
    case 'shortcut':
      file = {
        ...parseShortcutFile(unvalidatedFile),
        type,
      }
      break
    default:
      file = {
        ...parseNormalFile(unvalidatedFile),
        type,
      }
      break
  }

  return file
}

export const parseNormalFile = (unvalidatedFile: UnvalidatedGoogleDriveFile): BaseNormalFile => {
  const commmonFileAttr = parseCommonFileAttr(unvalidatedFile)
  const { size: sizeStr } = unvalidatedFile
  if (!sizeStr) {
    throw new RuntimeError(
      `Size is missing in Schema$File from the API response for file with name=${commmonFileAttr.name}`
    )
  }

  const size = parseInt(sizeStr)
  if (isNaN(size)) {
    throw new RuntimeError(
      `Invalid size returned in Schema$File from the API response for file with name=${commmonFileAttr.name} (size=${sizeStr})`
    )
  }

  const parseResult = baseNormalFileSchema.safeParse({
    ...commmonFileAttr,
    size,
  })
  if (parseResult.error) {
    throw new RuntimeError('Error validating Schema$File received from the API response')
  }
  return parseResult.data
}

const parseCommonFileAttr = (unvalidatedFile: UnvalidatedGoogleDriveFile): CommonFileAttr => {
  const { id, name, mimeType } = unvalidatedFile
  if (!id) {
    throw new RuntimeError('File ID is missing in Schema$File from the API response')
  }

  if (!name) {
    throw new RuntimeError(
      `Name is missing in Schema$File from the API response for file with ID=${unvalidatedFile.id}`
    )
  }

  if (!mimeType) {
    throw new RuntimeError(`MIME type is missing in Schema$File from the API response for file with name=${name}`)
  }

  let parentId: string | undefined = undefined
  if (unvalidatedFile.parents) {
    parentId = unvalidatedFile.parents[0]
    if (!parentId) {
      throw new RuntimeError(`Empty parent ID array in Schema$File from the API response for file with name=${name}`)
    }
  }

  return {
    id,
    name,
    mimeType,
    parentId,
  }
}

const parseFolderFile = (unvalidatedFile: UnvalidatedGoogleDriveFile): BaseFolderFile => {
  const commmonFileAttr = parseCommonFileAttr(unvalidatedFile)
  const parseResult = baseFolderFileSchema.safeParse(commmonFileAttr)
  if (parseResult.error) {
    throw new RuntimeError('Error validating Schema$File received from the API response')
  }
  return parseResult.data
}

const parseShortcutFile = (unvalidatedFile: UnvalidatedGoogleDriveFile): BaseShortcutFile => {
  const commmonFileAttr = parseCommonFileAttr(unvalidatedFile)
  const parseResult = baseShortcutFileSchema.safeParse(commmonFileAttr)
  if (parseResult.error) {
    throw new RuntimeError('Error validating Schema$File received from the API response')
  }
  return parseResult.data
}
