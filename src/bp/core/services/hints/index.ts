import * as sdk from 'botpress/sdk'
import { ObjectCache } from 'common/object-cache'
import { RealTimePayload } from 'core/sdk/impl'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import minimatch from 'minimatch'

import { GhostService } from '..'
import { TYPES } from '../../types'
import RealtimeService from '../realtime'

import FileBasedProviders from './file-based'
import BaseProvider from './file-based'

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

const stringFilePrefix = 'string::data/'

@injectable()
export class HintsService {
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
      await Promise.delay(100) // We let invalidation happens first
      if (!key.startsWith(stringFilePrefix)) {
        return
      }
      const filePath = key.substr(stringFilePrefix.length)
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
    hints['base'] = BaseProvider

    const files = [
      ...(await this.ghost.global().directoryListing('/')).map(x => 'global/' + x),
      ...(await this.ghost.bots().directoryListing('/')).map(x => 'bots/' + x)
    ]

    await Promise.mapSeries(files, async file => (hints[file] = await this.indexFile(file)))

    this.hints = hints
  }

  getHintsForBot(botId: string): Hint[] {
    return _.uniqBy(
      _.flatten(
        Object.keys(this.hints).map(key => {
          if (key.startsWith('global/') || key.startsWith('bots/' + botId)) {
            return this.hints[key]
          }
          return []
        })
      ),
      'name'
    )
  }
}
