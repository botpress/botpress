import * as sdk from 'botpress/sdk'
import fse from 'fs-extra'
import _ from 'lodash'
import path from 'path'

export default class NLUServerGhost {
  upsertFile(directory: string, fname: string, content: Buffer | string): void {
    const path = this.getPath(directory, fname)
    return fse.writeFileSync(path, content)
  }

  async readFileAsBuffer(directory: string, fname: string): Promise<Buffer> {
    const path = this.getPath(directory, fname)
    return fse.readFile(path)
  }

  readSync(directory: string, fname: string) {
    const path = this.getPath(directory, fname)
    return fse.readFileSync(path, { encoding: 'utf8' })
  }

  async dirExists(directory: string) {
    return new Promise(resolve => fse.exists(directory, ex => resolve(ex)))
  }

  async createDir(directory: string) {
    return fse.mkdir(directory)
  }

  async fileExists(directory: string, fname: string): Promise<boolean> {
    const path = this.getPath(directory, fname)
    return new Promise(resolve => fse.exists(path, ex => resolve(ex)))
  }

  async directoryListing(directory: string, fileEndingPattern: string, searchOrder: sdk.SortOrder): Promise<string[]> {
    const dirContent = await fse.readdir(directory)
    const files = dirContent.filter(f => f.endsWith(fileEndingPattern))

    const { column, desc } = searchOrder
    return _.orderBy(files, `${column}`, desc ? 'desc' : 'asc')
  }

  async deleteFile(directory: string, fname: string): Promise<void> {
    const path = this.getPath(directory, fname)
    return fse.unlink(path)
  }

  private getPath(directory: string, fname: string) {
    return path.join(directory, fname)
  }
}
