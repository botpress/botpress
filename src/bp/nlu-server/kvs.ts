import NLUServerGhost from './ghost'

const KVS_FILE_NAME = 'kvs.json'

type KVS = {
  [key: string]: any
}

export default class NLUServerKeyValueStore {
  constructor(private ghost: NLUServerGhost, private directory: string) {}

  async init() {
    const kvsExists = await this.ghost.fileExists(this.directory, KVS_FILE_NAME)
    if (!kvsExists) {
      const emptyKvs = JSON.stringify({})
      this.ghost.upsertFile(this.directory, KVS_FILE_NAME, emptyKvs)
    }
  }

  get(key: string) {
    const kvs = this.readKvs()
    return kvs[key]
  }

  set(key: string, value) {
    // TODO: mutex lock between the reading operation and writing operation
    const kvs = this.readKvs()
    kvs[key] = value
    return this.writeKvs(kvs)
  }

  remove(key: string) {
    // TODO: mutex lock between the reading operation and writing operation
    const kvs = this.readKvs()
    delete kvs[key]
    return this.writeKvs(kvs)
  }

  private readKvs(): KVS {
    try {
      const rawFileContent = this.ghost.readSync(this.directory, KVS_FILE_NAME)
      return JSON.parse(rawFileContent)
    } catch (err) {
      throw err
    }
  }

  private writeKvs(kvs: KVS): void {
    const rawFileContent = JSON.stringify(kvs, undefined, 2)
    this.ghost.upsertFile(this.directory, KVS_FILE_NAME, rawFileContent)
  }
}
