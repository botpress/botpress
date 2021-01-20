import bitfan from '@botpress/bitfan'
import { isSpace } from 'nlu-core/tools/token-utils'
import { Tools } from 'nlu-core/typings'

import { initializeTools } from '../initialize-tools'

import makeSpellChecker from './spell-checker'

class SpellingEngine implements bitfan.UnsupervisedEngine<'spell'> {
  private spellChecker?: (text: string) => Promise<string>

  constructor(private langServerUrl: string) {}

  private _initializeTools(): Promise<Tools> {
    // tslint:disable-next-line:no-console
    const log = (...x: any[]) => console.log(...x)
    const logger = { error: log, info: log, warning: log }
    const config = {
      ducklingEnabled: false,
      ducklingURL: '',
      languageSources: [{ endpoint: this.langServerUrl }]
    }
    return initializeTools(config, logger)
  }

  public train = async (corpus: bitfan.Document[], seed: number, progress: bitfan.ProgressCb) => {
    const tools = await this._initializeTools()
    const lang = corpus[0].lang
    const wholeText = corpus.map(c => c.text).join(' ')
    const [raw_tokens] = await tools.tokenize_utterances([wholeText], lang)
    const tokens = raw_tokens.filter(t => !isSpace(t))
    this.spellChecker = makeSpellChecker(tokens, lang, tools)
    progress(1)
  }

  public predict = async (testSet: bitfan.DataSet<'spell'>, progress: bitfan.ProgressCb) => {
    if (!this.spellChecker) {
      throw new Error('Spelling engine must be trained before usage.')
    }

    const { samples } = testSet
    const nSamples = samples.length

    let i = 0
    const results: bitfan.Prediction<'spell'>[] = []
    for (const sample of samples) {
      const { text, label } = sample
      const spellChecked = await this.spellChecker(text)
      results.push({
        text,
        label,
        candidates: [
          {
            elected: spellChecked,
            confidence: 1
          }
        ]
      })
      progress(++i / nSamples)
    }

    return results
  }
}

export default {
  name: 'bpds-spell',
  computePerformance: async () => {
    const stanEndpoint = 'https://lang-01.botpress.io'
    const engine = new SpellingEngine(stanEndpoint)

    const trainFileDef: bitfan.DocumentDef = {
      name: 'A-train',
      lang: 'en',
      fileType: 'document',
      type: 'spell',
      namespace: 'bpds'
    }

    const testFileDef: bitfan.DataSetDef<'spell'> = {
      name: 'A-test',
      lang: 'en',
      fileType: 'dataset',
      type: 'spell',
      namespace: 'bpds'
    }

    const problem: bitfan.UnsupervisedProblem<'spell'> = {
      name: 'bpds A spelling',
      type: 'spell',
      corpus: [await bitfan.datasets.readDocument(trainFileDef)],
      testSet: await bitfan.datasets.readDataset(testFileDef),
      lang: 'en'
    }

    const results = await bitfan.runSolution(
      {
        name: 'bpds spelling',
        problems: [problem],
        engine
      },
      [42]
    )

    const performanceReport = bitfan.evaluateMetrics(results, [bitfan.metrics.accuracy])
    bitfan.visualisation.showPerformanceReport(performanceReport)

    return performanceReport
  },
  evaluatePerformance: async (
    currentPerformance: bitfan.PerformanceReport,
    previousPerformance: bitfan.PerformanceReport
  ) => {
    const toleranceByMetric = {
      [bitfan.metrics.accuracy.name]: 0.02
    }
    return bitfan.comparePerformances(currentPerformance, previousPerformance, { toleranceByMetric })
  }
}
