import fs from 'fs'
import pathlib from 'path'

export class FSKeyValueCache<T extends Object> {
  private _initialized = false
  private _memoryCache: T | null = null

  public constructor(private _filepath: string) {}

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
      this._memoryCache = await this._readJSON(this._filepath)
    }
    return this._memoryCache![key]
  }

  public async set<K extends keyof T>(key: K, value: T[K]): Promise<void> {
    await this.init()
    const data: T = await this._readJSON(this._filepath)
    data[key] = value
    await this._writeJSON(this._filepath, data)
    this._memoryCache = null
  }

  public async rm<K extends keyof T>(key: K): Promise<void> {
    await this.init()
    const data: T = await this._readJSON(this._filepath)
    delete data[key]
    await this._writeJSON(this._filepath, data)
    this._memoryCache = null
  }

  public async clear(): Promise<void> {
    await this.init()
    await this._writeJSON(this._filepath, {})
    this._memoryCache = null
  }

  private _writeJSON = (filepath: string, data: any) => {
    const fileContent = JSON.stringify(data, null, 2)
    return fs.promises.writeFile(filepath, fileContent)
  }

  private _readJSON = async (filepath: string) => {
    const fileContent = await fs.promises.readFile(filepath, 'utf8')
    return JSON.parse(fileContent)
  }
}
