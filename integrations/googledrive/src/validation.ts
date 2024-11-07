import { RuntimeError } from '@botpress/sdk'
import { FOLDER_MIMETYPE, SHORTCUT_MIMETYPE } from './constants'
import { baseFolderFileSchema, baseNormalFileSchema, baseShortcutFileSchema } from './schemas'
import {
  BaseFolderFile,
  BaseGenericFile,
  BaseNormalFile,
  BaseShortcutFile,
  CommonFileAttr,
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

export const validateGenericFiles = (files: UnvalidatedGoogleDriveFile[]): BaseGenericFile[] => {
  return files.map((f) => validateGenericFile(f))
}

export const validateGenericFile = (unvalidatedFile: UnvalidatedGoogleDriveFile): BaseGenericFile => {
  const { mimeType } = validateCommonFileAttr(unvalidatedFile)
  let file: BaseGenericFile
  switch (mimeType) {
    case FOLDER_MIMETYPE:
      file = {
        ...validateFolderFile(unvalidatedFile),
        type: 'folder',
      }
      break
    case SHORTCUT_MIMETYPE:
      file = {
        ...validateShortcutFile(unvalidatedFile),
        type: 'shortcut',
      }
      break
    default:
      file = {
        ...validateNormalFile(unvalidatedFile),
        type: 'normal',
      }
      break
  }

  return file
}

export const validateNormalFile = (unvalidatedFile: UnvalidatedGoogleDriveFile): BaseNormalFile => {
  const commmonFileAttr = validateCommonFileAttr(unvalidatedFile)
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

const validateCommonFileAttr = (unvalidatedFile: UnvalidatedGoogleDriveFile): CommonFileAttr => {
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

const validateFolderFile = (unvalidatedFile: UnvalidatedGoogleDriveFile): BaseFolderFile => {
  const commmonFileAttr = validateCommonFileAttr(unvalidatedFile)
  const parseResult = baseFolderFileSchema.safeParse(commmonFileAttr)
  if (parseResult.error) {
    throw new RuntimeError('Error validating Schema$File received from the API response')
  }
  return parseResult.data
}

const validateShortcutFile = (unvalidatedFile: UnvalidatedGoogleDriveFile): BaseShortcutFile => {
  const commmonFileAttr = validateCommonFileAttr(unvalidatedFile)
  const parseResult = baseShortcutFileSchema.safeParse(commmonFileAttr)
  if (parseResult.error) {
    throw new RuntimeError('Error validating Schema$File received from the API response')
  }
  return parseResult.data
}
