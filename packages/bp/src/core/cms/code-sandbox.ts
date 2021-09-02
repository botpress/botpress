import { Logger } from 'botpress/sdk'
import { prepareRequire } from 'core/user-code/utils'
import fse from 'fs-extra'
import _ from 'lodash'
import path from 'path'
import tmp from 'tmp'
import { VError } from 'verror'
import { NodeVM } from 'vm2'

export interface CodeFile {
  relativePath: string
  code: string
}

export class SafeCodeSandbox {
  private tmpDir: tmp.SynchrounousResult
  private vm?: NodeVM
  private tmpPath: string
  private filesMap: { [name: string]: string } = {}

  constructor(private botId: string, logger: Logger) {
    this.tmpDir = tmp.dirSync({ prefix: `sandbox-${botId}`, keep: false, unsafeCleanup: true })
    this.tmpPath = this.tmpDir.name

    !process.DISABLE_CONTENT_SANDBOX && this.initializeVm(logger)
  }

  async addFiles(files: CodeFile[]) {
    for (const file of files) {
      await this.addFile(file)
    }
  }

  async addFile(file: CodeFile) {
    const filePath = path.resolve(this.tmpPath, file.relativePath)
    this.filesMap[file.relativePath] = filePath

    await fse.writeFile(filePath, file.code, 'utf8')
    return filePath
  }

  initializeVm(logger: Logger) {
    const lookups = [this.tmpPath, path.resolve(process.PROJECT_LOCATION)]
    const _require = prepareRequire(this.tmpPath, lookups)

    const modRequire = new Proxy(
      {},
      {
        get: (_obj, prop) => _require(prop)
      }
    )

    this.vm = new NodeVM({
      compiler: 'javascript',
      sandbox: {},
      timeout: 1000,
      console: 'redirect',
      sourceExtensions: ['js'],
      require: {
        builtin: ['path', 'assert', 'os', 'querystring', 'string_decoder', 'url', 'zlib', 'util', 'events'],
        external: true,
        context: 'sandbox',
        mock: modRequire
      }
    })

    this.vm.freeze(_, '_')

    const listen = this.vm['on'].bind(this.vm)
    listen('console.log', (...args) => {
      logger && logger.debug(args[0], _.tail(args))
    })
    listen('console.info', (...args) => {
      logger && logger.info(args[0], _.tail(args))
    })
    listen('console.warn', (...args) => {
      logger && logger.warn(args[0], _.tail(args))
    })
    listen('console.error', (...args) => {
      logger && logger.error(args[0], _.tail(args))
    })
  }

  ls(): string[] {
    return Object.keys(this.filesMap)
  }

  async run(fileName: string): Promise<any> {
    try {
      if (process.DISABLE_CONTENT_SANDBOX) {
        return require(this.filesMap[fileName])
      }

      const code = await fse.readFile(this.filesMap[fileName], 'utf8')
      return this.vm!.run(
        code,
        path.join(
          this.tmpPath,
          `${Math.random()
            .toString()
            .substr(2, 6)}.js`
        )
      ) // Await cause if it returns a promise we await it
    } catch (e) {
      throw new VError(e, `Error executing file "${fileName}" in SafeSandbox`)
    }
  }

  dispose(): void {
    this.tmpDir.removeCallback()
  }
}
