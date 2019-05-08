import { Logger } from 'botpress/sdk'
import fs from 'fs'
import fse from 'fs-extra'
import _ from 'lodash'
import { memoize } from 'lodash-decorators'
import path from 'path'
import tmp from 'tmp'
import { VError } from 'verror'
import { NodeVM } from 'vm2'

import { getCacheKeyInMinutes } from './utils'

export type CodeFile = {
  relativePath: string
  code: string
}

export class SafeCodeSandbox {
  private tmpDir: tmp.SynchrounousResult
  private vm: NodeVM
  private tmpPath: string
  private filesMap: { [name: string]: string } = {}

  constructor(files: CodeFile[], logger: Logger) {
    this.tmpDir = tmp.dirSync({ prefix: 'sandbox-', keep: false, unsafeCleanup: true })
    this.tmpPath = this.tmpDir.name

    for (const file of files) {
      const pt = path.resolve(path.join(this.tmpDir.name, file['folder']))
      fse.mkdirpSync(pt)
      // TODO: use the correct module path
      const filePath = path.resolve(path.join(this.tmpDir.name, file['folder'], file.relativePath))
      this.filesMap[file.relativePath] = filePath

      fs.writeFileSync(filePath, file.code, 'utf8')
    }

    this.vm = new NodeVM({
      compiler: 'javascript',
      sandbox: {},
      timeout: 1000,
      console: 'redirect',
      sourceExtensions: ['js'],
      nesting: false,
      require: {
        builtin: ['path', 'assert', 'os', 'querystring', 'string_decoder', 'url', 'zlib', 'util'],
        external: true,
        context: 'sandbox',
        import: [],
        root: path.resolve(this.tmpPath, 'builtin') // TODO: use the correct module path
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
    const code = fs.readFileSync(this.filesMap[fileName], 'utf8')
    try {
      return this.vm.run(
        code,
        path.join(
          path.resolve(this.tmpPath, 'builtin'), // TODO: use the correct module path
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

export class UntrustedSandbox {
  @memoize(() => getCacheKeyInMinutes(5)) // cache the result of this function for 1 minute
  static getSandboxProcessArgs() {
    const exposedEnv = {
      ..._.pickBy(process.env, (_value, name) => name.startsWith('EXPOSED_')),
      ..._.pick(process.env, 'TZ', 'LANG', 'LC_ALL', 'LC_CTYPE')
    }

    return {
      ..._.pick(process, 'HOST', 'PORT', 'EXTERNAL_URL', 'PROXY'),
      env: exposedEnv
    }
  }
}
