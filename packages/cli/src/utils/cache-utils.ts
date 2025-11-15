import fs from 'fs'
import pathlib from 'path'

export class FSKeyValueCache<T extends Object> {
  private _initialized = false
  private _memoryCache: T | null = null
  private _lockfilePath: string

  public constructor(private _filepath: string) {
    this._lockfilePath = `${_filepath}.lock`
  }

  public async init(): Promise<void> {
    if (this._initialized) {
      return
    }
    const dirname = pathlib.dirname(this._filepath)
    if (!fs.existsSync(dirname)) {
      await fs.promises.mkdir(dirname, { recursive: true })
    }
    if (!fs.existsSync(this._filepath)) {
      await this._writeJSON(this._filepath, {})
    }
    this._initialized = true
  }

  public async sync<K extends keyof T>(
    key: K,
    value: T[K] | undefined,
    prompt: (initial?: T[K]) => Promise<T[K]>
  ): Promise<T[K]> {
    await this.init()
    if (value) {
      await this.set(key, value)
      return value
    }
    const data = await this.get(key)
    const newValue = await prompt(data)
    await this.set(key, newValue)
    return newValue
  }

  public async has<K extends keyof T>(key: K): Promise<boolean> {
    await this.init()
    const data = await this._readJSON(this._filepath)
    return data[key] !== undefined
  }

  public async get<K extends keyof T>(key: K): Promise<T[K] | undefined> {
    await this.init()
    if (!this._memoryCache) {
      await this._acquireLock()
      try {
        if (!this._memoryCache) {
          this._memoryCache = await this._readJSON(this._filepath)
        }
      } finally {
        await this._releaseLock()
      }
    }
    return this._memoryCache![key]
  }

  public async set<K extends keyof T>(key: K, value: T[K]): Promise<void> {
    await this.init()
    await this._acquireLock()
    try {
      const data: T = await this._readJSON(this._filepath)
      data[key] = value
      await this._writeJSON(this._filepath, data)
      this._memoryCache = null
    } finally {
      await this._releaseLock()
    }
  }

  public async rm<K extends keyof T>(key: K): Promise<void> {
    await this.init()
    await this._acquireLock()
    try {
      const data: T = await this._readJSON(this._filepath)
      delete data[key]
      await this._writeJSON(this._filepath, data)
      this._memoryCache = null
    } finally {
      await this._releaseLock()
    }
  }

  public async clear(): Promise<void> {
    await this.init()
    await this._acquireLock()
    try {
      await this._writeJSON(this._filepath, {})
      this._memoryCache = null
    } finally {
      await this._releaseLock()
    }
  }

  private async _acquireLock(): Promise<void> {
    const maxRetries = 100
    const retryDelay = 10

    for (let i = 0; i < maxRetries; i++) {
      try {
        await fs.promises.writeFile(this._lockfilePath, String(process.pid), { flag: 'wx' })
        return
      } catch (error: any) {
        if (error.code === 'EEXIST') {
          const shouldContinue = await this._handleLockExists()
          if (shouldContinue) {
            continue
          }
          await new Promise((resolve) => setTimeout(resolve, retryDelay))
        } else {
          throw error
        }
      }
    }

    throw new Error(`Failed to acquire lock on ${this._filepath} after ${maxRetries} retries`)
  }

  private async _handleLockExists(): Promise<boolean> {
    try {
      const stats = await fs.promises.stat(this._lockfilePath)
      const age = Date.now() - stats.mtimeMs
      if (age > 5000) {
        await fs.promises.unlink(this._lockfilePath).catch(() => {})
        return true
      }
    } catch {
      // Ignore stat errors, continue with retry
    }
    return false
  }

  private async _releaseLock(): Promise<void> {
    try {
      await fs.promises.unlink(this._lockfilePath)
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error
      }
    }
  }

  private _writeJSON = (filepath: string, data: any) => {
    const fileContent = JSON.stringify(data, null, 2)
    return fs.promises.writeFile(filepath, fileContent)
  }

  private _readJSON = async (filepath: string) => {
    const fileContent = await fs.promises.readFile(filepath, 'utf8')
    if (!fileContent || fileContent.trim() === '') {
      return {} as T
    }
    try {
      return JSON.parse(fileContent)
    } catch {
      console.warn(`Warning: Cache file ${filepath} is corrupted, resetting to empty cache`)
      return {} as T
    }
  }
}
