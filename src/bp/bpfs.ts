import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import chalk from 'chalk'
import { bytesToString } from 'core/misc/utils'
import followRedirects from 'follow-redirects'
import fse from 'fs-extra'
import glob from 'glob'
import _ from 'lodash'
import path from 'path'
import rimraf from 'rimraf'

import { extractArchive } from './core/misc/archive'
import { createArchiveFromFolder } from './core/misc/archive'
import { asBytes } from './core/misc/utils'
import { FileChanges } from './core/services'

// This is a dependency of axios, and sets the default body limit to 10mb. Need it to be higher
followRedirects.maxBodyLength = asBytes('500mb')

// If the push will cause one of these actions, then a force will be required
const blockingActions = ['del', 'edit']

/**
 * These files must be ignored when pushing them to the remote host.
 * assets and models are auto-generated and .js.map files are not required
 */
const pushedArchiveIgnoredFiles = ['assets/**/*', 'bots/*/models/**', '**/*.js.map']

class BPFS {
  private serverUrl: string
  private authToken: string
  private targetDir: string

  constructor(args, action: string) {
    this.serverUrl = args.url.replace(/\/+$/, '')
    this.authToken = args.authToken
    this.targetDir = args.targetDir

    if (!this.serverUrl || !this.authToken || !this.authToken.length) {
      this._endWithError(`Missing parameter "url" or "authToken"`)
    }

    if (!this.targetDir || (action === 'push' && !fse.existsSync(path.resolve(this.targetDir)))) {
      this._endWithError(`Target directory is not valid: "${this.targetDir}"`)
    }
  }

  async pullChanges() {
    const cleanBefore = process.argv.includes('--clean')
    const axiosClient = this._getPullAxiosClient()

    try {
      // We clear only those two folders, so assets are preserved
      if (cleanBefore) {
        console.log(chalk.blue(`Cleaning data folder before pulling data...`))
        await this._clearDir(path.resolve(this.targetDir, 'global'))
        await this._clearDir(path.resolve(this.targetDir, 'bots'))
      } else if (fse.existsSync(path.resolve(this.targetDir))) {
        const fileCount = await this._filesCount(path.resolve(this.targetDir))
        console.log(chalk.blue(`Remote files will be pulled in an existing folder containing ${fileCount} files`))
      }

      console.log(chalk.blue(`Pulling all remote changes from ${this.printUrl} to ${this.printTarget} ...`))

      const { data: archive } = await axiosClient.get('export')

      await extractArchive(archive, this.targetDir)
      console.log(
        chalk.green(
          `Successfully extracted changes on your local file system. Archive size: ${bytesToString(archive.length)}`
        )
      )
    } catch (err) {
      const error = err.response ? `${err.response.statusText} (${err.response.status})` : err.message
      this._endWithError(`Could not pull changes: ${error}`)
    }
  }

  async pushChanges() {
    const useForce = process.argv.includes('--force')
    const dryRun = process.argv.includes('--dry')

    try {
      console.log(chalk.blue(`Preparing an archive of your local files...`))

      const archive = await createArchiveFromFolder(this.targetDir, pushedArchiveIgnoredFiles)
      const axiosClient = this._getPushAxiosClient(archive.length)

      console.log(
        chalk.blue(`Sending archive to server for comparison... (Archive size: ${bytesToString(archive.length)})`)
      )
      const { data } = await axiosClient.post('changes', archive)
      const { changeList, blockingChanges, localFiles } = this._processChanges(data)

      if (_.isEmpty(blockingChanges) || useForce) {
        this._printChangeList(changeList)

        if (dryRun) {
          console.log(chalk.yellow(`Dry run completed. Nothing was pushed to server`))
          return process.exit()
        }

        console.log(chalk.blue(`Pushing local changes to ${this.printUrl}...`))
        useForce && console.log(chalk.yellow('Using --force'))

        await axiosClient.post('update', archive)
        console.log(chalk.green(`Successfully pushed ${localFiles.length} local files to remote server!`))
      } else {
        this._printOutOfSync()
        this._printChangeList(changeList)
        console.log(chalk.red(`Nothing was pushed on the remote server.`))
      }
    } catch (err) {
      const error = err.response ? `${err.response.statusText} (${err.response.status})` : err.message
      this._endWithError(`Could not push changes: ${error}`)
    }
  }

  private async _filesCount(directory: string) {
    const files: string[] = await Promise.fromCallback(cb =>
      glob('**/*', { cwd: directory, nodir: true, dot: true }, cb)
    )
    return files.length
  }

  private _processChanges(data: FileChanges) {
    const changeList = _.flatten(data.map(x => x.changes))
    return {
      localFiles: _.flatten(data.map(x => x.localFiles)),
      blockingChanges: changeList.filter(x => blockingActions.includes(x.action)),
      changeList
    }
  }

  private _getPushAxiosClient(archiveSize: number): AxiosInstance {
    return axios.create({
      baseURL: `${this.serverUrl}/api/v1/admin/versioning`,
      headers: {
        Authorization: `Bearer ${this.authToken}`,
        'Content-Type': 'application/tar+gzip',
        'Content-Disposition': `attachment; filename=archive_${Date.now()}.tgz`,
        'Content-Length': archiveSize
      }
    })
  }

  private _getPullAxiosClient(): AxiosInstance {
    return axios.create({
      baseURL: `${this.serverUrl}/api/v1/admin/versioning`,
      headers: {
        Authorization: `Bearer ${this.authToken}`
      },
      responseType: 'arraybuffer'
    })
  }

  private async _clearDir(destination: string): Promise<void> {
    if (fse.existsSync(destination)) {
      return Promise.fromCallback(cb => rimraf(destination, cb))
    }
  }

  private _printLine({ action, path, add, del }): string {
    if (action === 'add') {
      return chalk.green(` + ${path}`)
    } else if (action === 'del') {
      return chalk.red(` - ${path}`)
    } else if (action === 'edit') {
      return ` o ${path} (${chalk.green('+' + add)} / -${chalk.redBright(del)})`
    }
    return ''
  }

  private _printOutOfSync() {
    console.log(chalk`
{bold Out of sync! }
  You have changes on your file system that aren't synchronized to the remote environment.

  (Replace {bold "push"} with {bold "pull"} in your command to pull remote changes on your file system)
  (Use ${chalk.yellow('--force')} to overwrite the remote files by your local files)
`)
  }

  private _printChangeList(changes) {
    if (!changes.length) {
      return
    }

    const lines = _.orderBy(changes, 'action')
      .map(this._printLine)
      .join('\n')

    return console.log(`Differences between your local changes (green) vs remote changes (red):

${lines}
`)
  }

  private _endWithError(message: string) {
    console.log(chalk.red(`${chalk.bold('Error:')} ${message}`))
    process.exit()
  }

  get printUrl() {
    return chalk.bold(this.serverUrl)
  }

  get printTarget() {
    return chalk.bold(path.resolve(this.targetDir))
  }
}

export default async (argv, action) => {
  const bpfs = new BPFS(argv, action)
  console.log(`\n`)
  if (action === 'pull') {
    await bpfs.pullChanges()
  } else if (action === 'push') {
    await bpfs.pushChanges()
  }
  console.log(`\n`)
}
