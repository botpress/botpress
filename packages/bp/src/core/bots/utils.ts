import { existsSync } from 'fs'
import { join } from 'path'

/**
 * Finds files that were deleted in a given folder.
 * @param files A list of files (relative path)
 * @param folder A folder to walk through and test if files were deleted from it
 * @returns A list of deleted files (relative path)
 */
export const findDeletedFiles = async (files: string[], folder: string): Promise<string[]> => {
  const deletedFiles: string[] = []
  for (const f of files) {
    const path = join(folder, f)
    if (!existsSync(path)) {
      deletedFiles.push(f)
    }
  }
  return deletedFiles
}
