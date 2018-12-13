import * as sdk from 'botpress/sdk'
import fs from 'fs'
import _ from 'lodash'
import path from 'path'
import { tmpNameSync } from 'tmp'

import { DocumentClassifier } from './classifier'
import * as Converters from './converters'
import levenshtein from './tools/levenshtein'

export interface Snippet {
  source: 'doc'
  name: string
  page: string
  paragraph: string
  content: string
  mergeWith: { page: string; paragraph: string }[]
}

export class Indexer {
  static ghostProvider: (botId: string) => sdk.ScopedGhostService
  static converters: Converters.Converter[] = [Converters.Pdf, Converters.Text]
  _forceSyncDebounce: (() => Promise<void>) & _.Cancelable

  constructor(
    private readonly botId: string,
    private readonly classifier: DocumentClassifier,
    private readonly logger: sdk.Logger
  ) {
    this._forceSyncDebounce = _.debounce(this._forceSync, 500)
  }

  async forceSync(skipDebounce: boolean = false) {
    if (skipDebounce) {
      this._forceSyncDebounce.cancel()
      await this._forceSync()
    }

    await this._forceSyncDebounce()
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
    return `${snippet.source}__${snippet.name.substr(0, 10)}__${snippet.page}__${snippet.paragraph}`
      .replace(/[^A-Z0-9_]/gi, '')
      .toLowerCase()
  }

  private async *_pullDocuments(): AsyncIterableIterator<Snippet[]> {
    const ghost = Indexer.ghostProvider(this.botId)
    const files = await ghost.directoryListing('./knowledge', '*.*')

    for (const file of files) {
      try {
        const converter = Indexer.converters.find(c => c.fileExtensions.includes(path.extname(file)))
        if (!converter) {
          continue
        }

        const tmpFile = tmpNameSync()

        const fileBuff = await ghost.readFileAsBuffer('./knowledge', file)
        fs.writeFileSync(tmpFile, fileBuff)

        const content = await converter(tmpFile)
        yield this._splitDocument(file, content)
      } catch (err) {
        this.logger.attachError(err).warn(`Could not index file ${file}`)
      }
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
        snippets.push({
          name,
          source: 'doc',
          page: pageidx.toString(),
          paragraph: pidx.toString(),
          content: p,
          mergeWith: []
        })
      })
    })

    // Delete similar snippets (similarity = 90%)

    const filtered = snippets.filter(s1 => {
      if (s1.content.length < 5) {
        return true
      }

      const cutoff = s1.content.length - Math.max(s1.content.length * 0.9, 1)
      return !snippets.find(s2 => {
        if (s1 === s2 || s2.content.length < 5) {
          return false
        }

        const length = Math.abs(s2.content.length - s1.content.length)
        const ratio = Math.min(length / s2.content.length, length / s1.content.length)

        if (ratio >= 0.2) {
          return false
        }

        const dist = levenshtein(s1.content, s2.content)
        return dist <= cutoff
      })
    })

    // Delete "small" phrases that has neibhours that are also "small"
    // Small is characterized by being 3 std-deviation away

    const mean = _.meanBy(filtered, x => x.content.length)
    const std = Math.sqrt(_.sumBy(filtered, x => Math.pow(x.content.length - mean, 2)) / filtered.length - 1)
    const remove: Snippet[] = []
    for (let i = 1; i < filtered.length - 1; i++) {
      const mine = filtered[i].content.length / std
      if (mine <= 0.3) {
        const before = filtered[i - 1].content.length / std
        const after = filtered[i + 1].content.length / std
        if (before <= 0.3 && after <= 0.3) {
          remove.push(filtered[i])
        }
      }
    }

    const relevant = _.without(filtered, ...remove)

    // Let's find the paragraph starts
    // Paragraphs can start in many ways:
    // - They are header-like (i.e. a bullet point or question)
    // - Two chunk of text separated by one or more white lines

    const grouped: Snippet[] = []
    let currentSnippet: Snippet | undefined

    if (!relevant.length) {
      return []
    } else {
      currentSnippet = relevant[0]
    }

    for (let i = 1; i < relevant.length; i++) {
      const el = relevant[i]
      const pEl = relevant[i - 1]
      const isHeaderLike = /(^(\d|[A-Z])\W)|(\?\W*$)/i.test(el.content.trim())
      const isBigSpace = el.content.trim().length <= 10 && pEl.content.trim().length <= 10
      const isFar = currentSnippet && Math.abs(Number(el.page) - Number(currentSnippet!.page)) > 1
      const isAlreadyBig = currentSnippet && currentSnippet!.content.length >= 1000

      if (isHeaderLike || isBigSpace || isFar || isAlreadyBig) {
        if (currentSnippet && currentSnippet.content.length >= 80) {
          currentSnippet.content = currentSnippet.content.trim()
          grouped.push(currentSnippet)
          currentSnippet = undefined
        }
        if (!isBigSpace) {
          currentSnippet = { ...el }
        }
      } else {
        if (currentSnippet) {
          currentSnippet.content += ' ___|___ ' + el.content
        } else {
          currentSnippet = { ...el }
        }
      }
    }

    if (currentSnippet && currentSnippet.content.length >= 80) {
      grouped.push(currentSnippet)
    }

    return grouped
  }
}
