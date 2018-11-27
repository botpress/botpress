import * as sdk from 'botpress/sdk'
import fs from 'fs'
import _ from 'lodash'
import { EOL } from 'os'
import tmp, { tmpNameSync } from 'tmp'

import { Snippet } from './indexer'
import FastTextWrapper from './tools/fastText'

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

  async loadMostRecent() {
    const ghost = DocumentClassifier.ghostProvider(this.botId)
    const files = await ghost.directoryListing('./models', '*.bin')

    const mostRecent = _.last(files.filter(f => f.startsWith('knowledge_')).sort())

    if (mostRecent && mostRecent.length) {
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
      const content = this._sanitize(indexedSnippets[idx].content)
      fs.appendFileSync(trainFile, `${idx} ${content}${EOL}`)
    }

    const ft = new FastTextWrapper(fullModelPath)
    ft.train(trainFile, { method: 'supervised' })

    this._ft = ft
    this._index = indexedSnippets
    this._modelPath = fullModelPath
  }

  private _sanitize(content: string): string {
    return content.replace(/[^\w -]/gi, '').trim()
  }

  async predict(text: string): Promise<{ snippet: Snippet; confidence: number }[]> {
    text = this._sanitize(text)

    if (!this._ft) {
      return []
    }

    const results = await this._ft.predict(text, 5)
    return results.map(c => ({ snippet: this._index[c.name]!, confidence: c.confidence })).filter(c => !!c.snippet)
  }
}
