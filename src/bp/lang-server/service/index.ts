import { MLToolkit } from 'botpress/sdk'
import { WrapErrorsWith } from 'errors'
import fs from 'fs'
import _ from 'lodash'
import path from 'path'
import { VError } from 'verror'

import toolkit from '../../ml/toolkit'

import { AvailableModel, LoadedBPEModel, LoadedFastTextModel, ModelFileInfo, ModelSet } from './typing'

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

  listFastTextModels = (): AvailableModel[] => {
    return _.values(this._models).map(m => m.fastTextModel)
  }

  private _discoverModels() {
    if (!fs.existsSync(this.langDir)) {
      return
    }

    const files = fs.readdirSync(this.langDir)

    const filesInfo: ModelFileInfo[] = []

    _.forEach(files, file => {
      // Examples:  "scope.en.300.bin" "bp.fr.150.bin"
      const fastTextModelsRegex = /(\w+)\.(\w+)\.(\d+)\.bin/i
      const fastTextModelsMatch = file.match(fastTextModelsRegex)

      // Examples: "scope.en.bpe.model" "bp.en.bpe.model"
      const bpeModelsRegex = /(\w+)\.(\w+)\.bpe\.model/i
      const bpeModelsMatch = file.match(bpeModelsRegex)

      if (!!fastTextModelsMatch) {
        const [__, domain, langCode, dim] = fastTextModelsMatch
        filesInfo.push({ domain, langCode, dim: Number(dim), file: file })
        return
      }
      if (!!bpeModelsMatch) {
        const [__, domain, langCode, _] = bpeModelsMatch
        filesInfo.push({ domain, langCode, file })
      }
    })

    const modelGroups = _.groupBy(filesInfo, x => [x.domain, x.langCode])
    _.forEach(modelGroups, modelGroup => {
      const domain = modelGroup[0].domain
      const langCode = modelGroup[0].langCode

      const fastTextModelFileInfo = modelGroup.find(f => f.dim === this.dim)
      const bpeModelFileInfo = modelGroup.find(f => !f.dim)
      if (domain !== this.domain || !fastTextModelFileInfo || !bpeModelFileInfo) {
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
    const loadingAction = async (lang: string) => {
      const model = new toolkit.FastText.Model(false, true, true)
      const path = this._models[lang].fastTextModel.path
      await model.loadFromFile(path)
      return { model, path }
    }
    const { model, usedDelta } = await this._getRessourceConsumptionInfo(lang, loadingAction)

    const loadedModel = <LoadedFastTextModel>{
      ...this._models[lang].fastTextModel,
      model,
      sizeInMb: usedDelta,
      loaded: true
    }
    return loadedModel
  }

  private async _loadBPEModel(lang: string): Promise<LoadedBPEModel> {
    const loadingAction = lang => {
      const tokenizer = toolkit.SentencePiece.createProcessor()
      const path = this._models[lang].bpeModel.path
      tokenizer.loadModel(path)
      return Promise.resolve({ model: tokenizer, path })
    }

    const { model: tokenizer, usedDelta } = await this._getRessourceConsumptionInfo(lang, loadingAction)

    const loadedModel = <LoadedBPEModel>{
      ...this._models[lang].bpeModel,
      tokenizer,
      sizeInMb: usedDelta,
      loaded: true
    }
    return loadedModel
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

  async vectorize(input: string, lang: string): Promise<[number[][], string[]]> {
    const { fastTextModel, bpeModel } = this._models[lang] as ModelSet
    if (!fastTextModel || !fastTextModel.loaded) {
      throw new Error(`FastText model for lang '${lang}' is not loaded in memory`)
    }
    if (!bpeModel || !bpeModel.loaded) {
      throw new Error(`BPE model for lang '${lang}' is not loaded in memory`)
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

  // TODO we might want to add a storage service
  remove(lang: string) {
    fs.readdirSync(this.langDir)
      .filter(file => file.includes(`.${lang}.`))
      .map(file => path.join(this.langDir, file))
      .map(fs.unlinkSync)

    delete this._models[lang]
  }
}
