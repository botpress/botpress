import { MLToolkit } from 'botpress/sdk'
import { WrapErrorsWith } from 'errors'
import fs from 'fs'
import _ from 'lodash'
import path from 'path'
import { VError } from 'verror'

import toolkit from '../../ml/toolkit'

type AvailableModel = {
  name: string
  path: string
  loaded: boolean
}

type LoadedModel = AvailableModel & { model: MLToolkit.FastText.Model; sizeInMb: number }

export default class LanguageService {
  private _models: Dic<AvailableModel | LoadedModel> = {}
  private readonly _langDir: string
  private _ready: boolean = false

  constructor(langDir?: string) {
    this._langDir = langDir || path.join(process.APP_DATA_PATH, 'embeddings')
  }

  async initialize() {
    if (Object.keys(this._models).length) {
      throw new Error('Language Service already initialized')
    }

    this._discoverModels()

    console.log(
      `Loading languages "${this.listModels()
        .map(x => x.name)
        .join(', ')}"`
    )

    for (const lang of Object.keys(this._models)) {
      await this._loadModel(lang)
    }

    this._ready = true
  }

  isReady(): boolean {
    return this._ready
  }

  listModels(): AvailableModel[] {
    return _.values(this._models)
  }

  private _discoverModels() {
    if (!fs.existsSync(this._langDir)) {
      return []
    }

    const files = fs.readdirSync(this._langDir)
    return files.forEach(f => {
      // Examples:  "scope.en.300.bin" "bp.fr.150.bin"
      const regex = /(\w+)\.(\w+)\.(\d+)\.bin/i
      const match = f.match(regex)
      if (!match) {
        return
      }

      this._provideLanguage(match[2], path.join(this._langDir, f))
    })
  }

  private _provideLanguage(lang: string, modelPath: string) {
    try {
      if (!fs.existsSync(modelPath)) {
        throw new Error(`Model '${lang}' at location '${modelPath}' does not exist`)
      }
    } catch (err) {
      throw new VError(`Could not find model '${lang}' at '${modelPath}'`, err)
    }

    this._models[lang] = {
      name: lang,
      path: modelPath,
      sizeInMb: 0,
      loaded: false
    }
  }

  @WrapErrorsWith(args => `Couldn't load language model "${args[0]}"`)
  private async _loadModel(lang: string) {
    const usedBefore = process.memoryUsage().rss / 1024 / 1024
    const dtBefore = Date.now()

    const model = new toolkit.FastText.Model(false, true, true)
    await model.loadFromFile(this._models[lang].path)

    const dtAfter = Date.now()
    const usedAfter = process.memoryUsage().rss / 1024 / 1024
    const usedDelta = Math.round(usedAfter - usedBefore)
    const dtDelta = dtAfter - dtBefore

    this._models[lang] = <LoadedModel>{ ...this._models[lang], model, sizeInMb: usedDelta, loaded: true }
    console.log(`language model '${lang}' took about ${usedDelta}mb of RAM and ${dtDelta}ms to load`)
  }

  async vectorize(tokens: string[], lang: string): Promise<number[][]> {
    const _model = this._models[lang] as LoadedModel
    if (!_model || !_model.loaded) {
      throw new Error(`Model for lang '${lang}' is not loaded in memory`)
    }

    return Promise.mapSeries(tokens, token => _model.model.queryWordVectors(token.toLowerCase()))
  }
}
