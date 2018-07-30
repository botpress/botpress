import path from 'path'

export const normalizeFolder = botLocation => folder => {
  const folderPath = path.resolve(botLocation, folder)
  return {
    folderPath,
    normalizedFolderName: path.relative(botLocation, folderPath)
  }
}
