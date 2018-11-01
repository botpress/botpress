import { SDK } from '.'
import Parser from './parser'
import DialogflowProvider from './providers/dialogflow'
import LuisProvider from './providers/luis'
import NativeProvider from './providers/native'
import RasaProvider from './providers/rasa'
import RecastProvider from './providers/recast'
import Storage from './storage'

export default class ScopedNlu {
  private bp: SDK
  botId: string
  storage: Storage
  provider: any
  config: any
  minConfidence: number
  maxConfidence: number
  retryPolicy: any

  constructor(bp, botId) {
    this.bp = bp
    this.botId = botId
  }

  initialize = async () => {
    this.config = await this.bp.config.getModuleConfigForBot('nlu', this.botId)
    this.storage = new Storage(this.bp, this.config, this.botId)

    const Provider = {
      dialogflow: DialogflowProvider,
      luis: LuisProvider,
      rasa: RasaProvider,
      recast: RecastProvider,
      native: NativeProvider
    }[this.config.provider.toLowerCase()]

    if (!Provider) {
      throw new Error(`Unknown NLU provider "${this.config.provider}"`)
    }

    this.minConfidence = parseFloat(this.config.minimumConfidence)

    if (isNaN(this.minConfidence) || this.minConfidence < 0 || this.minConfidence > 1) {
      this.minConfidence = 0
    }

    this.maxConfidence = parseFloat(this.config.maximumConfidence)

    if (isNaN(this.maxConfidence) || this.maxConfidence < 0) {
      this.maxConfidence = 10000
    }

    const storage = this.storage
    const config = this.config
    const bp = this.bp

    this.provider = new Provider({
      botId: this.botId,
      logger: bp.logger,
      storage,
      parser: new Parser(),
      kvs: bp.kvs,
      config
    })
    await this.provider.init()

    this.retryPolicy = {
      interval: 100,
      max_interval: 500,
      timeout: 5000,
      max_tries: 3
    }
  }
}
