import * as _path from 'path'
import fs from 'fs'

export function writeToDataDir(path: string, content: string) {
  fs.writeFileSync(_path.join(__dirname, _path.join('../data/', path)), content, 'utf-8')
}

export function readFromDataDir(path: string): string {
  return fs.readFileSync(_path.join(__dirname, _path.join('../data/', path)), 'utf-8')
}
