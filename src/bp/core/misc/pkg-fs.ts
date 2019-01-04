import fs from 'fs'
import { ensureDirSync } from 'fs-extra'
import glob from 'glob'
import path from 'path'

export type CopyFilter = (path: string) => boolean

const defaultFilter: CopyFilter = path => true

export async function copyDir(src: string, dest: string, filter: CopyFilter = defaultFilter) {
  if (!path.isAbsolute(dest)) {
    dest = path.resolve(process.PROJECT_LOCATION, dest)
  }

  ensureDirSync(dest)

  let files = glob.sync('**/*', { cwd: src, nodir: true, dot: true })

  if (filter) {
    files = files.filter(filter)
  }

  return Promise.mapSeries(files, f =>
    Promise.fromCallback(async cb => {
      const fileDest = path.join(dest, f)
      const fileDir = path.dirname(fileDest)

      if (fileDir.length) {
        ensureDirSync(fileDir)
      }

      const buffer = await Promise.fromCallback(cb => {
        fs.readFile(path.join(src, f), cb)
      })

      fs.writeFile(fileDest, buffer, cb)
    })
  )
}
