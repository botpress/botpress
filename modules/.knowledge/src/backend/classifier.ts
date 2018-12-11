import * as sdk from 'botpress/sdk'
import fs from 'fs'
import _ from 'lodash'
import tmp, { tmpNameSync } from 'tmp'

import { Snippet } from './indexer'
import FastTextWrapper from './tools/fastText'

type Prediction = Snippet & { confidence: number; ref: string }

export class DocumentClassifier {
  private _index: { [canonical: string]: Snippet } = {}
  private _modelPath: string
  private _ft: FastTextWrapper

  static ghostProvider: (botId: string) => sdk.ScopedGhostService

  constructor(private readonly botId: string) {}

  loadFromBuffer(indexedSnippets: { [canonical: string]: Snippet }, modelBuffer: Buffer) {
    this._index = indexedSnippets
    this._modelPath = tmpNameSync({ postfix: '.bin' })
    fs.writeFileSync(this._modelPath, modelBuffer)
    this._ft = new FastTextWrapper(this._modelPath)
  }

  async getMostRecentModel(): Promise<string | undefined> {
    const ghost = DocumentClassifier.ghostProvider(this.botId)
    const files = await ghost.directoryListing('./models', '*.bin')
    const mostRecent = _.last(files.filter(f => f.startsWith('knowledge_')).sort())

    return mostRecent && mostRecent.toString()
  }

  async loadMostRecent() {
    const ghost = DocumentClassifier.ghostProvider(this.botId)
    const mostRecent = await this.getMostRecentModel()

    if (mostRecent) {
      const index = await ghost.readFileAsObject<{ [canonical: string]: Snippet }>(
        './models',
        mostRecent.replace('knowledge_', 'knowledge_meta_').replace('.bin', '.json')
      )
      const buff = await ghost.readFileAsBuffer('./models', mostRecent)
      await this.loadFromBuffer(index, buff)
    }
  }

  async train(indexedSnippets: { [canonical: string]: Snippet }, fullModelPath: string) {
    const trainFile = tmp.tmpNameSync({ postfix: '.txt' })

    for (const idx in indexedSnippets) {
      const utterances = indexedSnippets[idx].content.split('___|___')

      for (const utterance of utterances) {
        const content = this._sanitize(utterance)
        if (content.length > 3) {
          fs.appendFileSync(trainFile, `__label__${idx} ${content}\n`)
        }
      }
    }

    const ft = new FastTextWrapper(fullModelPath)
    ft.train(trainFile, {
      method: 'supervised',
      epoch: 1000,
      bucket: 25000,
      minCount: 1,
      minn: 3,
      maxn: 6,
      wordGram: 5,
      dim: 10,
      learningRate: 0.2
    })

    this._ft = ft
    this._index = indexedSnippets
    this._modelPath = fullModelPath
  }

  private _sanitize(content: string): string {
    return content
      .replace(/[^\w -]/gi, '')
      .trim()
      .toLowerCase()
  }

  async predict(text: string): Promise<Prediction[]> {
    text = this._sanitize(text)

    if (!this._ft) {
      return []
    }

    const predictions = await this._ft.predict(text, 5)

    const results: Prediction[] = predictions
      .map(c => ({
        ...this._index[c.name]!,
        confidence: c.confidence,
        ref: c.name,
        content: this._index[c.name].content.replace(/___\|___/gi, '')
      }))
      .filter(c => c.name)

    return results
  }
}
