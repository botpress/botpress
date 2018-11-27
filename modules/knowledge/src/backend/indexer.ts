import * as sdk from 'botpress/sdk'
import fs from 'fs'
import _ from 'lodash'
import path from 'path'
import { tmpNameSync } from 'tmp'

import { DocumentClassifier } from './classifier'
import * as Converters from './converters'

export interface Snippet {
  source: 'doc'
  name: string
  page: string
  paragraph: string
  content: string
}

export class Indexer {
  static ghostProvider: (botId: string) => sdk.ScopedGhostService
  static converters: Converters.Converter[] = [Converters.Pdf]
  _forceSyncDebounce: (() => Promise<void>) & _.Cancelable

  constructor(private readonly botId: string, private readonly classifier: DocumentClassifier) {
    this._forceSyncDebounce = _.debounce(this._forceSync, 500)
  }

  async forceSync(skipDebounce: boolean = false) {
    if (skipDebounce) {
      this._forceSyncDebounce.cancel()
      return this._forceSync()
    }

    return this._forceSyncDebounce()
  }

  private async _forceSync() {
    const modelName = Date.now()
    const metadataFile = `knowledge_meta_${modelName}.json`
    const modelFile = `knowledge_${modelName}.bin`

    const tmpModelLoc = tmpNameSync({ postfix: '.bin' })

    const snippetIndex: { [canonical: string]: Snippet } = {}

    for await (const snippets of this._pullDocuments()) {
      for (const snippet of snippets) {
        const label = this._snippetToCanonical(snippet)
        snippetIndex[label] = snippet
      }
    }

    Indexer.ghostProvider(this.botId).upsertFile('./models', metadataFile, JSON.stringify(snippetIndex, undefined, 2))
    await this.classifier.train(snippetIndex, tmpModelLoc)

    const modelBuff: Buffer = fs.readFileSync(tmpModelLoc)
    await Indexer.ghostProvider(this.botId).upsertFile('./models', modelFile, modelBuff)

    await this.classifier.loadFromBuffer(snippetIndex, modelBuff)
  }

  private _snippetToCanonical(snippet: Snippet): string {
    return `__label__${snippet.source}___${snippet.name}___${snippet.page}___${snippet.paragraph}`
  }

  private async *_pullDocuments(): AsyncIterableIterator<Snippet[]> {
    const ghost = Indexer.ghostProvider(this.botId)
    const files = await ghost.directoryListing('./knowledge', '*.*')

    for (const file of files) {
      const converter = Indexer.converters.find(c => c.fileExtensions.includes(path.extname(file)))
      if (!converter) {
        continue
      }

      const tmpFile = tmpNameSync()

      const fileBuff = await ghost.readFileAsBuffer('./knowledge', file)
      fs.writeFileSync(tmpFile, fileBuff)

      const content = await converter(tmpFile)
      yield this._splitDocument(file, content)
    }
  }

  private async _splitDocument(name: string, content: string): Promise<Snippet[]> {
    const snippets: Snippet[] = []

    const pages = content.split(String.fromCharCode(0x0c))

    pages.forEach((page, pageidx) => {
      page.split(/\r\n|\n/gi).forEach((p, pidx) => {
        // TODO Split paragraphs smarter here
        // i.e. if small line, check if Question
        // if empty ... etc
        snippets.push({ name, source: 'doc', page: pageidx.toString(), paragraph: pidx.toString(), content: p })
      })
    })

    return snippets
  }
}
