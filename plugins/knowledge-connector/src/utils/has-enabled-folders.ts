export function hasEnabledFolders(
  settings: Record<string, Record<string, { syncNewFiles?: boolean; path?: string }>>
): boolean {
  for (const folders of Object.values(settings)) {
    for (const folderSettings of Object.values(folders)) {
      if (folderSettings.syncNewFiles) {
        return true
      }
    }
  }
  return false
}
