import { RuntimeError } from '@botpress/sdk'
import { APP_GOOGLE_FOLDER_MIMETYPE, APP_GOOGLE_SHORTCUT_MIMETYPE } from './mime-types'
import { baseFolderFileSchema, baseNormalFileSchema, baseShortcutFileSchema } from './schemas'
import {
  BaseFileChannel,
  BaseFolderFile,
  BaseGenericFile,
  BaseNormalFile,
  BaseShortcutFile,
  CommonFileAttr,
  UnvalidatedGoogleDriveChannel,
  UnvalidatedGoogleDriveFile,
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

export const parseChannel = (channel: UnvalidatedGoogleDriveChannel): BaseFileChannel => {
  const { resourceId, id: channelId } = channel
  if (!resourceId) {
    throw new RuntimeError('Resource ID is missing in Schema$Channel from the API response')
  }

  if (!channelId) {
    throw new RuntimeError('Channel ID is missing in Schema$Channel from the API response')
  }

  return {
    channelId,
    resourceId,
  }
}

export const parseGenericFiles = (files: UnvalidatedGoogleDriveFile[]): BaseGenericFile[] => {
  return files.map((f) => parseGenericFile(f))
}

export const parseGenericFile = (unvalidatedFile: UnvalidatedGoogleDriveFile): BaseGenericFile => {
  const { mimeType } = parseCommonFileAttr(unvalidatedFile)
  let file: BaseGenericFile
  switch (mimeType) {
    case APP_GOOGLE_FOLDER_MIMETYPE:
      file = {
        ...parseFolderFile(unvalidatedFile),
        type: 'folder',
      }
      break
    case APP_GOOGLE_SHORTCUT_MIMETYPE:
      file = {
        ...parseShortcutFile(unvalidatedFile),
        type: 'shortcut',
      }
      break
    default:
      file = {
        ...parseNormalFile(unvalidatedFile),
        type: 'normal',
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
