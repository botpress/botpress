import * as sdk from 'botpress/sdk'

export class ModelStorage {
  static ghostProvider: (botId: string) => sdk.ScopedGhostService
}
