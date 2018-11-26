import * as sdk from 'botpress/sdk'
import fs from 'fs'
import _ from 'lodash'
import { EOL } from 'os'
import path from 'path'
import tmp from 'tmp'

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

  constructor(private readonly botId: string) {
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
    const ftModel = tmp.tmpNameSync({ postfix: '.txt' })

    for await (const snippets of this._pullDocuments()) {
      for (const snippet of snippets) {
        const label = this._snippetToCanonical(snippet)
        fs.appendFileSync(ftModel, label + ' ' + snippet.content + EOL)
      }
    }
  }

  private _snippetToCanonical(snippet: Snippet): string {
    return `__label__${snippet.source}___${snippet.name}___${snippet.page}___${snippet.paragraph}`
  }

  private _canonicalToSnippet(canonical: string): Snippet {
    const parts = canonical.split('___')
    return { content: '', source: 'doc', name: parts[1], page: parts[2]!, paragraph: parts[3]! }
  }

  private async _setupWatcher() {}

  private async *_pullDocuments(): AsyncIterableIterator<Snippet[]> {
    const ghost = Indexer.ghostProvider(this.botId)
    const files = await ghost.directoryListing('./knowledge', '*.*')

    for (const file of files) {
      const converter = Indexer.converters.find(c => c.fileExtensions.includes(path.extname(file)))
      if (!converter) {
        continue
      }

      const content = await converter(file)
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
