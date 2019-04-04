import * as sdk from 'botpress/sdk'
import { flatten, groupBy } from 'lodash'

import ScopedEngine from './engine'
import { FiveFolder, RecordCallback, Result } from './tools/five-fold'

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

  /** Toggles computing Confusion Matrices on training */
  public computeConfusionOnTrain: boolean = false

  async init(): Promise<void> {
    await super.init()
  }

  protected async trainModels(intentDefs: sdk.NLU.IntentDefinition[], modelHash: string) {
    await super.trainModels(intentDefs, modelHash)

    if (!this.computeConfusionOnTrain) {
      return
    }

    const dataset = this._definitionsToEntry(intentDefs)
    const folder = new FiveFolder<TrainingEntry>(dataset)

    this.modelIdx = 0
    this.modelName = ''
    this.originalModelHash = modelHash

    await folder.fold('intents', this._trainIntents.bind(this), this._evaluateIntents.bind(this))
    await this._processResults(folder.getResults())
  }

  private async _processResults(results: Result) {
    const reportUrl = process['EXTERNAL_URL'] + `/api/v1/bots/${this.botId}/mod/nlu/confusion/${this.originalModelHash}`
    await this.storage.saveConfusionMatrix(this.originalModelHash, results)

    const intents = results['intents']
    this.logger.debug('=== Confusion Matrix ===')
    this.logger.debug(`F1: ${intents['all'].f1} P1: ${intents['all'].precision} R1: ${intents['all'].recall}`)
    this.logger.debug(`Details available here: ${reportUrl}`)
  }

  private _definitionsToEntry(def: sdk.NLU.IntentDefinition[]): TrainingEntry[] {
    return flatten(
      def.map(x =>
        x.utterances.map(
          u =>
            ({
              definition: x,
              utterance: u
            } as TrainingEntry)
        )
      )
    )
  }

  private _entriesToDefinition(entries: TrainingEntry[]): sdk.NLU.IntentDefinition[] {
    const groups = groupBy<TrainingEntry>(entries, x => x.definition.name + '|' + x.definition.contexts.join('+'))
    return Object.keys(groups).map(
      x =>
        ({
          ...groups[x][0].definition,
          utterances: groups[x].map(x => x.utterance)
        } as sdk.NLU.IntentDefinition)
    )
  }

  private async _trainIntents(dataSet: TrainingEntry[]) {
    const defs = this._entriesToDefinition(dataSet)
    this.modelName = `${this.originalModelHash}-fold${this.modelIdx++}`
    await super.trainModels(defs, this.modelName)
  }

  private async _evaluateIntents(dataSet: TrainingEntry[], record: RecordCallback) {
    const defs = this._entriesToDefinition(dataSet)

    await this.loadModels(defs, this.originalModelHash)
    const expected = await Promise.mapSeries(dataSet, (__, idx) => this.extract(dataSet[idx].utterance, []))

    await this.loadModels(defs, this.modelName)
    const actual = await Promise.mapSeries(dataSet, (__, idx) => this.extract(dataSet[idx].utterance, []))

    dataSet.forEach((__, idx) => record(expected[idx].intent.name, actual[idx].intent.name))
  }
}
