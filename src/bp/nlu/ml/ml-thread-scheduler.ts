import getos from 'getos'
import _ from 'lodash'
import os from 'os'
import path from 'path'
import { Worker, WorkerOptions } from 'worker_threads'

// TODO: if thread B, started after thread A but done faster, it should be returned next by BaseScheduler
export class BaseScheduler<T> {
  private elements: { el: T; turns: number }[] = []

  // TODO: still not quite sure if we want the threads to be lazy created... Logic could be even simpler if not.
  constructor(private maxElements: number, private elementGenerator: () => Promise<T>) {}

  async getNext(): Promise<T> {
    this.elements.forEach(el => el.turns++)

    if (this.elements.length < this.maxElements) {
      const el = await this.elementGenerator()
      this.elements.push({ el, turns: 0 })
      return el
    }

    const lru = _.maxBy(this.elements, el => el.turns)!
    lru.turns = 0
    return lru.el
  }
}

export class MLThreadScheduler extends BaseScheduler<Worker> {
  constructor(maxElements: number) {
    super(maxElements, makeWorker)
  }
}

async function makeWorker() {
  const distro = (await Promise.fromCallback(getos)
    .timeout(1000)
    .catch(_err => ({
      os: os.platform(),
      dist: 'default',
      codename: 'N/A',
      release: 'N/A'
    }))) as typeof process.distro

  const clean = data => _.omitBy(data, val => val == null || typeof val === 'object')
  const processData = {
    VERBOSITY_LEVEL: process.VERBOSITY_LEVEL,
    IS_PRODUCTION: process.IS_PRODUCTION,
    IS_PRO_AVAILABLE: process.IS_PRO_AVAILABLE,
    BPFS_STORAGE: process.BPFS_STORAGE,
    APP_DATA_PATH: process.APP_DATA_PATH,
    ROOT_PATH: process.ROOT_PATH,
    IS_LICENSED: process.IS_LICENSED,
    IS_PRO_ENABLED: process.IS_PRODUCTION,
    BOTPRESS_VERSION: process.BOTPRESS_VERSION,
    SERVER_ID: process.SERVER_ID,
    LOADED_MODULES: process.LOADED_MODULES,
    PROJECT_LOCATION: process.PROJECT_LOCATION,
    distro: JSON.stringify(distro)
  }

  const workerEntryPoint = path.resolve(__dirname, './ml-thread-index.js')
  return new Worker(workerEntryPoint, ({
    workerData: {
      processData: clean(processData),
      processEnv: clean(process.env)
    },
    env: { ...process.env }
  } as any) as WorkerOptions) // TODO: update nodejs typings to Node 12
}
