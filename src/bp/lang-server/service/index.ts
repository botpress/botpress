import { MLToolkit } from 'botpress/sdk'
import { WrapErrorsWith } from 'errors'
import fs from 'fs'
import _ from 'lodash'
import path from 'path'
import { VError } from 'verror'

import toolkit from '../../ml/toolkit'

interface ModelSet {
  bpeModel: AvailableModel | LoadedBPEModel
  fastTextModel: AvailableModel | LoadedFastTextModel
}

type AvailableModel = {
  name: string
  path: string
  loaded: boolean
}
type LoadedFastTextModel = AvailableModel & { model: MLToolkit.FastText.Model; sizeInMb: number }

type LoadedBPEModel = AvailableModel & {
  tokenizer: MLToolkit.SentencePiece.Processor
  sizeInMb: number
}

export default class LanguageService {
  private _models: Dic<ModelSet> = {}
  private _ready: boolean = false

  constructor(public readonly dim: number, public readonly domain: string, private readonly langDir: string) {}

  async initialize() {
    if (Object.keys(this._models).length) {
      throw new Error('Language Service already initialized')
    }

    this._discoverModels()

    console.log(
      `Loading languages "${this.listFastTextModels()
        .map(x => x.name)
        .join(', ')}"`
    )

    for (const lang of Object.keys(this._models)) {
      await this._loadModels(lang)
    }

    this._ready = true
  }

  isReady(): boolean {
    return this._ready
  }

  listFastTextModels(): AvailableModel[] {
    const allModels = _.values(this._models)
    return allModels.map(m => m.fastTextModel)
  }

  private _discoverModels() {
    if (!fs.existsSync(this.langDir)) {
      return
    }

    const files = fs.readdirSync(this.langDir)

    type modelFileInfo = {
      domain: string
      langCode: string
      file: string
      dim?: number
    }
    const filesInfo: modelFileInfo[] = []

    files.forEach(f => {
      // Examples:  "scope.en.300.bin" "bp.fr.150.bin"
      const fastTextModelsRegex = /(\w+)\.(\w+)\.(\d+)\.bin/i
      const fastTextModelsMatch = f.match(fastTextModelsRegex)

      // Examples: "scope.en.bpe.model" "bp.en.bpe.model"
      const bpeModelsRegex = /(\w+)\.(\w+)\.bpe\.model/i
      const bpeModelsMatch = f.match(bpeModelsRegex)

      if (!!fastTextModelsMatch) {
        const [__, domain, langCode, dim] = fastTextModelsMatch
        filesInfo.push({ domain, langCode, dim: Number(dim), file: f })
        return
      }
      if (!!bpeModelsMatch) {
        const [__, domain, langCode, _] = bpeModelsMatch
        filesInfo.push({ domain, langCode, file: f })
      }
    })

    const modelGroups = _.groupBy(filesInfo, x => [x.domain, x.langCode])

    _.forEach(modelGroups, v => {
      const domain = v[0].domain
      const langCode = v[0].langCode

      const fastTextModelFileInfo = v.find(f => f.dim === this.dim)
      const bpeModelFileInfo = v.find(f => !f.dim)
      if (domain != this.domain || !fastTextModelFileInfo || !bpeModelFileInfo) {
        console.log('skipping', domain, langCode)
        return
      }

      this._provideLanguage(langCode, fastTextModelFileInfo.file, bpeModelFileInfo.file)
    })
  }

  private _provideLanguage(lang: string, fastTextModelName: string, bpeModelName: string) {
    const fastTextModelPath = path.join(this.langDir, fastTextModelName)
    const bpeModelPath = path.join(this.langDir, bpeModelName)

    try {
      if (!fs.existsSync(fastTextModelPath)) {
        throw new Error(`Model '${lang}' at location '${fastTextModelPath}' does not exist`)
      }
      if (!fs.existsSync(bpeModelPath)) {
        throw new Error(`Model '${lang}' at location '${bpeModelPath}' does not exist`)
      }
    } catch (err) {
      throw new VError(`Could not find model '${lang}' in '${this.langDir}'`, err)
    }

    const fastTextModel = {
      name: lang,
      path: fastTextModelPath,
      sizeInMb: 0,
      loaded: false
    }

    const bpeModel = {
      name: lang,
      path: bpeModelPath,
      sizeInMb: 0,
      loaded: false
    }
    this._models[lang] = { fastTextModel, bpeModel }
  }

  @WrapErrorsWith(args => `Couldn't load language model "${args[0]}"`)
  private async _loadModels(lang: string) {
    const fastTextModel = await this._loadFastTextModel(lang)
    const bpeModel = await this._loadBPEModel(lang)
    this._models[lang] = { fastTextModel, bpeModel }
  }

  private async _loadFastTextModel(lang: string): Promise<LoadedFastTextModel> {
    const usedBefore = process.memoryUsage().rss / 1024 / 1024
    const dtBefore = Date.now()

    const model = new toolkit.FastText.Model(false, true, true)
    await model.loadFromFile(this._models[lang].fastTextModel.path)

    const dtAfter = Date.now()
    const usedAfter = process.memoryUsage().rss / 1024 / 1024
    const usedDelta = Math.round(usedAfter - usedBefore)
    const dtDelta = dtAfter - dtBefore

    const loadedModel = <LoadedFastTextModel>{
      ...this._models[lang].fastTextModel,
      model,
      sizeInMb: usedDelta,
      loaded: true
    }
    console.log(`language model '${lang}' took about ${usedDelta}mb of RAM and ${dtDelta}ms to load`)

    return loadedModel
  }

  private async _loadBPEModel(lang: string): Promise<LoadedBPEModel> {
    const usedBefore = process.memoryUsage().rss / 1024 / 1024
    const dtBefore = Date.now()

    const tokenizer = toolkit.SentencePiece.createProcessor()
    tokenizer.loadModel(this._models[lang].bpeModel.path)

    const dtAfter = Date.now()
    const usedAfter = process.memoryUsage().rss / 1024 / 1024
    const usedDelta = Math.round(usedAfter - usedBefore)
    const dtDelta = dtAfter - dtBefore

    const loadedModel = <LoadedBPEModel>{
      ...this._models[lang].bpeModel,
      tokenizer,
      sizeInMb: usedDelta,
      loaded: true
    }
    console.log(`bpe tonization model '${lang}' took about ${usedDelta}mb of RAM and ${dtDelta}ms to load`)

    return loadedModel
  }

  async vectorize(input: string, lang: string): Promise<[number[][], string[]]> {
    const { fastTextModel, bpeModel } = this._models[lang] as ModelSet
    if (!fastTextModel || !fastTextModel.loaded || !bpeModel || !bpeModel.loaded) {
      throw new Error(`One of FastText model or Sentencepiece bpe model for lang '${lang}' is not loaded in memory`)
    }

    const tokens = (bpeModel as LoadedBPEModel).tokenizer.encode(input)

    const vectors = await Promise.mapSeries(tokens, token =>
      (fastTextModel as LoadedFastTextModel).model.queryWordVectors(token.toLowerCase())
    )

    return [vectors, tokens]
  }

  async vectorizeTokens(tokens: string[], lang: string): Promise<[number[][], string[]]> {
    const { fastTextModel } = this._models[lang] as ModelSet
    if (!fastTextModel || !fastTextModel.loaded) {
      throw new Error(`Model for lang '${lang}' is not loaded in memory`)
    }

    const vectors = await Promise.mapSeries(tokens, token =>
      (fastTextModel as LoadedFastTextModel).model.queryWordVectors(token.toLowerCase())
    )

    return [vectors, tokens]
  }
}
