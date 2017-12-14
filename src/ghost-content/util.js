import path from 'path'

export const normalizeFolder = projectLocation => folder => {
  const folderPath = path.resolve(projectLocation, folder)
  return {
    folderPath,
    normalizedFolderName: path.relative(projectLocation, folderPath)
  }
}
