import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import { get } from 'lodash'

import ScopedEngine from './engine'
import { keepEntityValues } from './pipelines/slots/pre-processor'
import { FiveFolder, RecordCallback, Result, SuiteResult } from './tools/five-fold'

type TrainingEntry = {
  utterance: string
  definition: sdk.NLU.IntentDefinition
}

/**
 * A specialized version of the NLU Engine that has added support for Confusion Matrix
 * This engine is much slower because it trains multiple models instead of only one
 * For practical reasons, set `computeConfusionOnTrain` to true to enable Confusion Matrix computations.
 */
export default class ConfusionEngine extends ScopedEngine {
  private modelName: string = ''
  private modelIdx: number = 0
  private originalModelHash: string = ''
  private _confusionComputing = false

  /** Toggles computing Confusion Matrices on training */
  public computeConfusionOnTrain: boolean = false

  async init(): Promise<void> {
    await super.init()
  }

  public get confusionComputing() {
    return this._confusionComputing
  }

  protected async trainModels(
    intentDefs: sdk.NLU.IntentDefinition[],
    modelHash: string,
    confusionVersion: string = undefined
  ) {
    for (const lang of this.languages) {
      await super.trainModels(intentDefs, modelHash)

      if (!this.computeConfusionOnTrain) {
        return
      }

      const dataset = this._definitionsToEntry(intentDefs, lang)

      this.modelIdx = 0
      this.modelName = ''
      this.originalModelHash = modelHash
      this._confusionComputing = true

      const contexts = _.chain(dataset)
        .flatMap(group => group.map(entry => entry.definition.contexts))
        .flatten()
        .uniq()
        .value()

      const folders = contexts.map(context => {
        const contextDataset = dataset.map(group =>
          group.filter(
            entry => entry.definition.contexts.includes('global') || entry.definition.contexts.includes(context)
          )
        )

        return { model: new FiveFolder<TrainingEntry>(contextDataset), context }
      })

      try {
        await Promise.mapSeries(folders, folder =>
          folder.model.fold(folder.context, this._trainIntents.bind(this, lang), this._evaluateIntents.bind(this, lang))
        )

        const results = folders.map(folder => folder.model.getResults())

        const meanValues = _.chain(results)
          .flatMap(res => Object.values(res))
          .flatMap(context => context.all)
          .map(keys =>
            _.chain(keys)
              .mapValues(val => Array.of(val))
              .value()
          )
          .reduce((a, b) => _.mergeWith(a, b, (c, d) => c.concat(d)))
          .mapValues(_.mean)
          .value()

        const allResults = [{ all: meanValues }, ...results].reduce((a, b) => ({ ...a, ...b }), {}) as Result

        await this._processResults(allResults, lang, confusionVersion)
      } finally {
        this._confusionComputing = false
      }
    }
  }

  private async _processResults(results: Result, lang: string, confusionVersion: string = undefined) {
    await this.storage.saveConfusionMatrix({
      modelHash: this.originalModelHash,
      lang,
      results,
      confusionVersion
    })

    const overall = results['all']
    this.logger.debug('=== Confusion Matrix ===')
    this.logger.debug(`F1: ${overall.f1} P1: ${overall.precision} R1: ${overall.recall}`)
  }

  _definitionsToEntry = (defs: sdk.NLU.IntentDefinition[], lang: string): TrainingEntry[][] =>
    defs.map(definition => (definition.utterances[lang] || []).map(utterance => ({ definition, utterance })))

  private _entriesToDefinition(entries: TrainingEntry[], lang): sdk.NLU.IntentDefinition[] {
    const groups = _.groupBy<TrainingEntry>(entries, x => x.definition.name + '|' + x.definition.contexts.join('+'))

    return Object.keys(groups).map(
      x =>
        ({
          ...groups[x][0].definition,
          utterances: { [lang]: groups[x].map(x => x.utterance) }
        } as sdk.NLU.IntentDefinition)
    )
  }

  private async _trainIntents(lang: string, dataSet: TrainingEntry[]) {
    const defs = this._entriesToDefinition(dataSet, lang)
    this.modelName = `${this.originalModelHash}-fold${this.modelIdx++}`
    await super.trainModels(defs, this.modelName)
  }

  private async _evaluateIntents(
    lang: string,
    trainSet: TrainingEntry[],
    testSet: TrainingEntry[],
    record: RecordCallback
  ) {
    const defs = this._entriesToDefinition(trainSet, lang)

    await this.loadModels(defs, this.modelName)

    const actual = await Promise.mapSeries(testSet, (__, idx) =>
      this.extract(keepEntityValues(testSet[idx].utterance), [], [])
    )

    testSet.forEach((__, idx) => record(testSet[idx].definition.name, get(actual[idx], 'intent.name', 'none')))
  }
}
