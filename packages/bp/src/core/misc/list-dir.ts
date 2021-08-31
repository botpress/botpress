import fs from 'fs'
import path from 'path'

export interface FileListing {
  relativePath: string
  absolutePath: string
}

export function listDir(
  dirPath: string,
  ignores: RegExp[] = [],
  files: FileListing[] = [],
  rootPath = dirPath
): FileListing[] {
  let filesNames = fs.readdirSync(dirPath)

  filesNames = filesNames.filter(x => {
    const match = ignores.filter(i => x.match(i))
    return match && !match.length
  })

  for (const fileName of filesNames) {
    const filePath = path.join(dirPath, fileName)
    const fileStats = fs.statSync(filePath)

    if (fileStats.isDirectory()) {
      files = listDir(filePath, ignores, files, rootPath)
    } else {
      // We keep the files paths relative to the dir root
      files.push({ relativePath: path.relative(rootPath, filePath), absolutePath: filePath })
    }
  }

  return files
}
