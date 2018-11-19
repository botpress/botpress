import { gaId, machineUUID } from 'common/stats'
import { inject, injectable, postConstruct } from 'inversify'
import ua, { Visitor } from 'universal-analytics'

import { ConfigProvider } from './config/config-loader'
import { TYPES } from './types'

export type StatsCategory = 'server' | 'bot' | 'auth' | 'license' | 'ce' | 'pro'

@injectable()
export class Statistics {
  private _visitor: Visitor | undefined
  private _queued: Function[] = []
  private _sendUsageStats!: boolean

  constructor(@inject(TYPES.ConfigProvider) private configProvider: ConfigProvider) {}

  @postConstruct()
  public async init() {
    const botpressConfig = await this.configProvider.getBotpressConfig()
    this._sendUsageStats = botpressConfig.sendUsageStats || true // Stats are activated by default

    const uuid = await machineUUID()
    this._visitor = ua(gaId, uuid, { strictCidFormat: false })
    this._queued.forEach(event => event())
    this._queued = []
  }

  public track(category: StatsCategory, action: string, label: string = '', value: string | number = '') {
    if (!this._sendUsageStats) {
      return
    }

    // Queue events while the visitor is not available
    if (!this._visitor) {
      this._queued.push(() => this.track(category, action, label, value))
      return
    }

    this._visitor.event(category, action, label, value, () => this._handleError).send()
  }

  private _handleError() {
    // ignore
  }
}
