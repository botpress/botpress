import * as sdk from 'botpress/sdk'

export default class Storage {
  private bp: typeof sdk
  private botId: string

  constructor(bp: typeof sdk, botId: string) {
    this.bp = bp
    this.botId = botId
  }

  async getTopics() {
    return this.bp.ghost.forBot(this.botId).readFileAsObject('ndu', 'topics.json')
  }

  async saveTopics(topics: any) {
    return this.bp.ghost.forBot(this.botId).upsertFile('ndu', `topics.json`, JSON.stringify(topics, undefined, 2))
  }

  async getLibrary() {
    return this.bp.ghost.forBot(this.botId).readFileAsObject('ndu', 'library.json')
  }
}
