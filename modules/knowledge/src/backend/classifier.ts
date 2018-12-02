import * as sdk from 'botpress/sdk'
import fs from 'fs'
import _ from 'lodash'
import { EOL } from 'os'
import tmp, { tmpNameSync } from 'tmp'

import { Snippet } from './indexer'
import FastTextWrapper from './tools/fastText'

const MIN_LENGTH = 80

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
      const content = this._sanitize(indexedSnippets[idx].content)
      if (content.length > 3) {
        fs.appendFileSync(trainFile, `__label__${idx} ${content}${EOL}`)
      }
    }

    const ft = new FastTextWrapper(fullModelPath)
    ft.train(trainFile, { method: 'supervised' })

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

    const predictions = await this._ft.predict(text, 100)

    const results: Prediction[] = predictions
      .map(c => ({ ...this._index[c.name]!, confidence: c.confidence, ref: c.name }))
      .filter(c => c.name)

    const documents = _.groupBy<Prediction>(results, r => r.name)
    let finalResults: Prediction[] = []

    for (const docName in documents) {
      const candidates = _.sortBy<Prediction>(documents[docName], x => x.page, x => x.paragraph)
      const allSnippets = _.values(this._index).filter(x => x.name === docName)
      const ordered = _.sortBy<Snippet>(allSnippets, x => x.page, x => x.paragraph)
      const range = Math.round(Math.max(allSnippets.length / 20, 2))
      const visited = {}

      for (const d of candidates) {
        if (visited[d.ref]) {
          continue
        }

        const docIndex = ordered.findIndex(x => x.page == d.page && x.paragraph == d.paragraph)
        const nearby = ordered.filter((_x, i) => i > docIndex && i <= docIndex + range)
        console.log(nearby, range, docIndex)

        const pred: Prediction = { ...d }

        for (const n of nearby) {
          if (pred.content.length <= MIN_LENGTH || n.content.length <= MIN_LENGTH) {
            // Eliminates questions
            // This regex matches phrases that look like a question or header
            // E.g.
            // -> 34. Prerequisites
            // -> Is this a question?
            if (/(^(\d|[A-Z])\W)|(\?\W*$)/i.test(n.content.trim())) {
              continue
            }

            pred.content = pred.content + ' ' + n.content
            const alsoCandidate = _.find<Prediction>(candidates, x => x.page === n.page && x.paragraph === n.paragraph)
            if (alsoCandidate) {
              visited[alsoCandidate.ref] = true
              pred.confidence += alsoCandidate.confidence
            }
          }
        }

        if (pred.content.length >= MIN_LENGTH) {
          pred.content = pred.content.trim()
          finalResults.push(pred)
        }
      }
    }

    finalResults = _.take(_.orderBy<Prediction>(finalResults, x => x.confidence, 'desc'), 5)
    return finalResults
  }
}
