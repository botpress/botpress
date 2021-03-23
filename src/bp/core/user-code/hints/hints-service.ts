import * as sdk from 'botpress/sdk'
import { ObjectCache } from 'common/object-cache'
import { TYPES } from 'core/app/types'
import { GhostService } from 'core/bpfs'
import { startsWithI } from 'core/misc/utils'
import { RealtimeService, RealTimePayload } from 'core/realtime'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import minimatch from 'minimatch'

import BaseProvider from './base-provider'
import FileBasedProviders from './file-based'

const debug = DEBUG('hints')

export interface FileBasedHintProvider {
  readonly filePattern: string | string[]
  readonly readFile: boolean
  indexFile: (filePath: string, content: string) => Hint[]
}

export interface Hint {
  scope: 'inputs'
  name: string
  source: string
  category: 'VARIABLES'
  partial: boolean
  description?: string
  location?: string
  parentObject?: string
}

const invalidationFilePrefix = 'string::data/'

@injectable()
export class HintsService {
  // We store hints per key because we want to:
  // 1) do partial updates to hints when updating a single file
  // 2) cherry-pick only the files that belong to a certain bot
  // The key always starts with "global/" or "bots/botId/"
  hints: { [key: string]: Hint[] } = {}

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'HintsService')
    private logger: sdk.Logger,
    @inject(TYPES.GhostService) private ghost: GhostService,
    @inject(TYPES.ObjectCache) private cache: ObjectCache,
    @inject(TYPES.RealtimeService) private realtimeService: RealtimeService
  ) {
    this._listenForCacheInvalidation()
  }

  private _listenForCacheInvalidation() {
    this.cache.events.on('invalidation', async key => {
      if (!key.startsWith(invalidationFilePrefix)) {
        return
      }

      // We let invalidation happens first
      // This is necessary because the ghost relies on the cache when reading file content
      await Promise.delay(100)
      const filePath = key.substr(invalidationFilePrefix.length)
      this.hints[filePath] = await this.indexFile(filePath)
      this.realtimeService.sendToSocket(RealTimePayload.forAdmins('hints.updated', {}))
    })
  }

  private async indexFile(filePath: string): Promise<Hint[]> {
    let content: string | undefined = undefined

    return _.flatten(
      await Promise.mapSeries(FileBasedProviders, async provider => {
        const patterns = Array.isArray(provider.filePattern) ? provider.filePattern : [provider.filePattern]
        const matched = _.some(patterns, p => minimatch(filePath, p, { nocase: true, nonull: true, dot: true }))

        if (!matched) {
          return []
        }

        try {
          if (filePath.startsWith('global/')) {
            const [, file] = filePath.match(/global\/(.+)/i)!
            content = content || (await this.ghost.global().readFileAsString('/', file))
          } else {
            const [, botId, file] = filePath.match(/bots\/(.+?)\/(.+)/i)!
            content = content || (await this.ghost.forBot(botId).readFileAsString('/', file))
          }
        } catch (err) {
          // May happens if file deleted, renamed etc
          return []
        }

        return provider.indexFile(filePath, content || '') as Hint[]
      })
    )
  }

  async refreshAll(): Promise<void> {
    const hints = {}
    hints['global/base'] = BaseProvider

    const files = [
      ...(await this.ghost.global().directoryListing('/')).map(x => 'global/' + x),
      ...(await this.ghost.bots().directoryListing('/')).map(x => 'bots/' + x)
    ]

    await Promise.mapSeries(files, async file => (hints[file] = await this.indexFile(file)))

    this.hints = hints
  }

  getHintsForBot(botId: string): Hint[] {
    return _.chain(this.hints)
      .filter((_v, key) => startsWithI(key, 'global/') || startsWithI(key, `bots/${botId}/`))
      .flatten()
      .uniqBy('name')
      .value()
  }
}
