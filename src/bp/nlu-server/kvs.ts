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
      await this.ghost.upsertFile(this.directory, KVS_FILE_NAME, new Buffer(emptyKvs))
    }
  }

  async get(key: string) {
    const kvs = await this.readKvs()
    return kvs[key]
  }

  async set(key: string, value): Promise<void> {
    // TODO: mutex lock between the reading operation and writing operation
    const kvs = await this.readKvs()
    kvs[key] = value
    return this.writeKvs(kvs)
  }

  async remove(key: string) {
    // TODO: mutex lock between the reading operation and writing operation
    const kvs = await this.readKvs()
    delete kvs[key]
    return this.writeKvs(kvs)
  }

  private async readKvs(): Promise<KVS> {
    const rawFileContent = (await this.ghost.readFileAsBuffer(this.directory, KVS_FILE_NAME)).toLocaleString()
    return JSON.parse(rawFileContent)
  }

  private async writeKvs(kvs: KVS): Promise<void> {
    const rawFileContent = JSON.stringify(kvs)
    await this.ghost.upsertFile(this.directory, KVS_FILE_NAME, new Buffer(rawFileContent))
  }
}
