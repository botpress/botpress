export function findFolderByPath(
  settings: Record<string, Record<string, { syncNewFiles?: boolean; path?: string }>>,
  filePath: string
): { kbId: string; folderId: string; syncNewFiles: boolean } | undefined {
  for (const [kbId, folders] of Object.entries(settings)) {
    for (const [folderId, folderSettings] of Object.entries(folders)) {
      if (folderSettings.path && filePath.startsWith(folderSettings.path)) {
        return { kbId, folderId, syncNewFiles: folderSettings.syncNewFiles }
      }
    }
  }
  return undefined
}
