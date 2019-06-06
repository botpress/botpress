import { MLToolkit } from 'botpress/sdk'
import { WrapErrorsWith } from 'errors'
import fs from 'fs'
import _ from 'lodash'
import lru from 'lru-cache'
import path from 'path'
import { VError } from 'verror'

import toolkit from '../../ml/toolkit'

import { AvailableModel, LoadedBPEModel, LoadedFastTextModel, ModelFileInfo, ModelSet } from './typing'

export default class LanguageService {
  private _models: Dic<ModelSet> = {}
  private _ready: boolean = false
  private _cache

  // Examples:  "scope.en.300.bin" "bp.fr.150.bin"
  private readonly FAST_TEXT_MODEL_REGEX = /^(\w+)\.(\w+)\.(\d+)\.bin$/i

  // Examples: "scope.en.bpe.model" "bp.en.bpe.model"
  private readonly BPE_MODEL_REGEX = /^(\w+)\.(\w+)\.bpe\.model$/i

  // This equals to 24H
  private readonly _maxAgeCacheInMS = 86400000

  constructor(public readonly dim: number, public readonly domain: string, private readonly langDir: string) {}

  async initialize() {
    if (Object.keys(this._models).length) {
      throw new Error('Language Service already initialized')
    }
    this._cache = new lru({
      maxAge: this._maxAgeCacheInMS
    })

    this._models = this._getModels()
    this._logLoadingModels()
    await Promise.all(Object.keys(this._models).map(this._loadModels.bind(this)))

    this._ready = true
  }

  isReady(): boolean {
    return this._ready
  }

  private _logLoadingModels = () => console.log(`Loading languages "${Object.keys(this._models).join(', ')}"`)
  public listFastTextModels = (): AvailableModel[] => _.values(this._models).map(model => model.fastTextModel)

  private _getFileInfo = (regexMatch: RegExpMatchArray, isFastText, file): ModelFileInfo => {
    const [__, domain, langCode, dim] = regexMatch
    return isFastText ? { domain, langCode, dim: Number(dim), file: file } : { domain, langCode, file }
  }

  private _getModelInfoFromFile = (file: string): ModelFileInfo => {
    const fastTextModelsMatch = file.match(this.FAST_TEXT_MODEL_REGEX)
    const bpeModelsMatch = file.match(this.BPE_MODEL_REGEX)

    return !!fastTextModelsMatch
      ? this._getFileInfo(fastTextModelsMatch, true, file)
      : !!bpeModelsMatch
      ? this._getFileInfo(bpeModelsMatch, false, file)
      : ({} as ModelFileInfo)
  }

  private _addPairModelToModels = (models: Dic<ModelSet>) => (modelGroup: ModelFileInfo[]) => {
    const domain = modelGroup[0].domain
    const langCode = modelGroup[0].langCode

    const fastTextModelFileInfo = modelGroup.find(f => f.dim === this.dim)
    const bpeModelFileInfo = modelGroup.find(f => !f.dim)

    if (domain !== this.domain || !fastTextModelFileInfo || !bpeModelFileInfo) {
      console.log('skipping', domain, langCode)
      return
    }

    models[langCode] = this._getPairModels(langCode, fastTextModelFileInfo.file, bpeModelFileInfo.file)
  }

  private _getPairModels(lang: string, fastTextModelName: string, bpeModelName: string) {
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

    return { fastTextModel, bpeModel }
  }

  @WrapErrorsWith(args => `Couldn't load language model "${args[0]}"`)
  private async _loadModels(lang: string) {
    const fastTextModel = await this._loadFastTextModel(lang)
    const bpeModel = await this._loadBPEModel(lang)
    this._models[lang] = { fastTextModel, bpeModel }
  }

  private async _loadFastTextModel(lang: string): Promise<LoadedFastTextModel> {
    const loadingAction = async (lang: string) => {
      const model = new toolkit.FastText.Model(false, true, true)
      const path = this._models[lang].fastTextModel.path
      await model.loadFromFile(path)
      return { model, path }
    }

    const { model, usedDelta } = await this._getRessourceConsumptionInfo(lang, loadingAction)

    return {
      ...this._models[lang].fastTextModel,
      model,
      sizeInMb: usedDelta,
      loaded: true
    } as LoadedFastTextModel
  }

  private async _loadBPEModel(lang: string): Promise<LoadedBPEModel> {
    const loadingAction = lang => {
      const tokenizer = toolkit.SentencePiece.createProcessor()
      const path = this._models[lang].bpeModel.path
      tokenizer.loadModel(path)
      return Promise.resolve({ model: tokenizer, path })
    }

    const { model: tokenizer, usedDelta } = await this._getRessourceConsumptionInfo(lang, loadingAction)

    return {
      ...this._models[lang].bpeModel,
      tokenizer,
      sizeInMb: usedDelta,
      loaded: true
    } as LoadedBPEModel
  }

  private async _getRessourceConsumptionInfo(
    lang: string,
    action: (
      lang: string
    ) => Promise<{ model: MLToolkit.SentencePiece.Processor | MLToolkit.FastText.Model; path: string }>
  ) {
    const usedBefore = process.memoryUsage().rss / 1024 / 1024
    const dtBefore = Date.now()

    const { model, path } = await action(lang)

    const dtAfter = Date.now()
    const usedAfter = process.memoryUsage().rss / 1024 / 1024
    const usedDelta = Math.round(usedAfter - usedBefore)
    const dtDelta = dtAfter - dtBefore

    console.log(`${path} '${lang}' took about ${usedDelta}mb of RAM and ${dtDelta}ms to load`)

    return { model, usedDelta, dtDelta }
  }

  private _getQueryVectors = (fastTextModel: LoadedFastTextModel) => async (token): Promise<number[]> => {
    const cacheKey = `${fastTextModel.name}/${fastTextModel.path}/${token}`

    if (this._cache.has(cacheKey)) {
      return this._cache.get(cacheKey)
    }

    const val = await fastTextModel.model.queryWordVectors(token)
    this._cache.set(cacheKey, val)
    return val
  }

  async tokenize(input: string, lang: string): Promise<string[]> {
    const { fastTextModel, bpeModel } = this._models[lang] as ModelSet
    if (!fastTextModel || !fastTextModel.loaded) {
      throw new Error(`FastText Model for lang '${lang}' is not loaded in memory`)
    }

    return await (bpeModel as LoadedBPEModel).tokenizer.encode(input).map(_.toLower)
  }

  async vectorize(tokens: string[], lang: string): Promise<number[][]> {
    const { fastTextModel } = this._models[lang] as ModelSet
    if (!fastTextModel || !fastTextModel.loaded) {
      throw new Error(`Model for lang '${lang}' is not loaded in memory`)
    }

    return await Promise.all(tokens.map(await this._getQueryVectors(fastTextModel as LoadedFastTextModel)))
  }

  getModels() {
    const models = this._getModels()
    return Object.keys(models).map(lang => {
      const loaded = this._models[lang] && this._models[lang].bpeModel.loaded && this._models[lang].fastTextModel.loaded
      return {
        lang,
        loaded
      }
    })
  }

  private _getModels(): Dic<ModelSet> {
    if (!fs.existsSync(this.langDir)) {
      throw new Error(`The language directory (${this.langDir}) doesn't exists.`)
    }

    const files = fs.readdirSync(this.langDir)
    const models: Dic<ModelSet> = {}
    const _scopedAddPairModelToModels = this._addPairModelToModels(models)

    _.chain(files)
      .map(this._getModelInfoFromFile)
      .reject(_.isEmpty)
      .groupBy(model => [model.domain, model.langCode])
      .forEach(_scopedAddPairModelToModels)
      .value()

    return models
  }

  // TODO we might want to add a storage service
  remove(lang: string) {
    fs.readdirSync(this.langDir)
      .filter(file => file.includes(`.${lang}.`))
      .map(file => path.join(this.langDir, file))
      .map(fs.unlinkSync)

    delete this._models[lang]
  }
}
