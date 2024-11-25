import { RuntimeError } from '@botpress/sdk'
import { APP_GOOGLE_FOLDER_MIMETYPE, APP_GOOGLE_SHORTCUT_MIMETYPE } from './mime-types'
import { baseFolderFileSchema, baseNormalFileSchema, baseShortcutFileSchema } from './schemas'
import {
  BaseFolderFile,
  BaseDiscriminatedFile,
  BaseNormalFile,
  BaseShortcutFile,
  CommonFileAttr,
  UnvalidatedGoogleDriveFile,
  FileType,
  UnvalidatedGoogleDriveChannel,
  BaseFileChannel,
} from './types'

export const parseChannel = (channel: UnvalidatedGoogleDriveChannel): BaseFileChannel => {
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

export const parseBaseGenerics = (files: UnvalidatedGoogleDriveFile[]): BaseDiscriminatedFile[] => {
  return files.map((f) => parseBaseGeneric(f))
}

export const parseBaseGeneric = (unvalidatedFile: UnvalidatedGoogleDriveFile): BaseDiscriminatedFile => {
  const { mimeType } = parseCommonFileAttr(unvalidatedFile)
  let file: BaseDiscriminatedFile
  const type = getFileTypeFromMimeType(mimeType)
  switch (type) {
    case 'folder':
      file = {
        ...parseBaseFolder(unvalidatedFile),
        type,
      }
      break
    case 'shortcut':
      file = {
        ...parseBaseShortcut(unvalidatedFile),
        type,
      }
      break
    default:
      file = {
        ...parseBaseNormal(unvalidatedFile),
        type,
      }
      break
  }

  return file
}

export const parseBaseNormal = (unvalidatedFile: UnvalidatedGoogleDriveFile): BaseNormalFile => {
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

const parseBaseFolder = (unvalidatedFile: UnvalidatedGoogleDriveFile): BaseFolderFile => {
  const commmonFileAttr = parseCommonFileAttr(unvalidatedFile)
  const parseResult = baseFolderFileSchema.safeParse(commmonFileAttr)
  if (parseResult.error) {
    throw new RuntimeError('Error validating Schema$File received from the API response')
  }
  return parseResult.data
}

const parseBaseShortcut = (unvalidatedFile: UnvalidatedGoogleDriveFile): BaseShortcutFile => {
  const commmonFileAttr = parseCommonFileAttr(unvalidatedFile)
  const parseResult = baseShortcutFileSchema.safeParse(commmonFileAttr)
  if (parseResult.error) {
    throw new RuntimeError('Error validating Schema$File received from the API response')
  }
  return parseResult.data
}
