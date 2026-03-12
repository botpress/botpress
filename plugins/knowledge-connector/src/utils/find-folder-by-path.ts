type FolderConfig = {
  syncNewFiles?: boolean
  path?: string
  integrationDefinitionName?: string
  integrationInstanceAlias?: string
  transferFileToBotpressAlias?: string
}

type FolderMatch = {
  kbId: string
  folderId: string
  syncNewFiles: boolean
  integrationDefinitionName?: string
  integrationInstanceAlias?: string
  transferFileToBotpressAlias?: string
}

export function findFolderByPath(
  settings: Record<string, Record<string, FolderConfig>>,
  filePath: string,
  integrationAlias?: string
): FolderMatch | undefined {
  let bestMatch: FolderMatch | undefined
  let bestMatchLength = 0

  for (const [kbId, folders] of Object.entries(settings)) {
    for (const [folderId, folderSettings] of Object.entries(folders)) {
      const rawPath = folderSettings.path
      const folderPath = rawPath && !rawPath.endsWith('/') ? `${rawPath}/` : rawPath
      if (
        folderPath &&
        filePath.startsWith(folderPath) &&
        folderPath.length > bestMatchLength &&
        (!integrationAlias || folderSettings.integrationInstanceAlias === integrationAlias)
      ) {
        bestMatchLength = folderPath.length
        bestMatch = {
          kbId,
          folderId,
          syncNewFiles: folderSettings.syncNewFiles ?? false,
          integrationDefinitionName: folderSettings.integrationDefinitionName,
          integrationInstanceAlias: folderSettings.integrationInstanceAlias,
          transferFileToBotpressAlias: folderSettings.transferFileToBotpressAlias,
        }
      }
    }
  }

  return bestMatch
}
