import { RuntimeError } from '@botpress/client'
import { drive_v3 } from 'googleapis'
import { getClient } from './client'
import * as bp from '.botpress'

const listFiles: bp.IntegrationProps['actions']['listFiles'] = async ({ ctx }) => {
  const client = await getClient(ctx)

  const listResponse = await client.files.list({
    corpora: 'user', // TODO: Limit to the configured drive
    // TODO: Shared drives
    // TODO: Support pagination
  })

  // TODO: S'assurer que tous les fields sont retournés (Zod schema?)

  const driveFilesAndFoldersPartial = listResponse.data.files
  if (!driveFilesAndFoldersPartial) {
    throw new RuntimeError('No files were returned by the API')
  }

  const getsResponse = await Promise.all(
    driveFilesAndFoldersPartial.map(async (fileInfosReduced) => {
      if (!fileInfosReduced.id) {
        throw new RuntimeError('File ID is missing')
      }
      return await client.files.get({
        fileId: fileInfosReduced.id,
        fields: 'id, name, mimeType, parents',
        // TODO: Shared drives
      })
    })
  )
  const driveFilesAndFoldersComplete = getsResponse.map((getResponse) => getResponse.data)
  const driveFolders = driveFilesAndFoldersComplete.filter(isFolder)
  const driveFoldersMap = new Map(driveFolders.map((folder) => [folder.id!, folder])) // TODO: Enlever le ! et gérer les erreurs

  const driveFiles = driveFilesAndFoldersComplete.filter((f) => !isFolder(f))
  const files = driveFiles.map((file) => ({
    id: file.id!, // TODO: Enlever le ! et gérer les erreurs
    name: getFilePath(file, driveFoldersMap),
  }))

  return {
    files,
  }
}

const isFolder = (file: drive_v3.Schema$File): boolean => {
  return file.mimeType === 'application/vnd.google-apps.folder'
}

const getFilePath = (file: drive_v3.Schema$File, driveFoldersMap: Map<string, drive_v3.Schema$File>): string => {
  if (!isFolder(file) && !file.parents) {
    throw new RuntimeError(`File ${file.name} has no parent`) // TODO: Un fichier a-t-il toujours un parent?
  }

  if (!file.parents) {
    return `/${file.name}`
  }

  const [parentId] = file.parents // Only one parent should be possible
  if (!parentId) {
    throw new RuntimeError(`Empty parent ID array for file ${file.name}`)
  }
  const parent = driveFoldersMap.get(parentId)
  if (!parent) {
    throw new RuntimeError(`Parent with ID ${parentId} of file ${file.name} not found`)
  }

  return `${getFilePath(parent, driveFoldersMap)}/${file.name}`
}

export default {
  listFiles,
} as const satisfies bp.IntegrationProps['actions']
