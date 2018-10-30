import crypto from 'crypto'
import { inject, injectable, postConstruct } from 'inversify'
import { machineId } from 'node-machine-id'
import os from 'os'
import ua, { Visitor } from 'universal-analytics'

import { ConfigProvider } from './config/config-loader'
import { TYPES } from './types'

export type StatsCategory = 'server' | 'bot' | 'api'

@injectable()
export class Statistics {
  private _visitor: Visitor | undefined
  private _queued: Function[] = []
  private _allowStats!: boolean

  constructor(@inject(TYPES.ConfigProvider) private configProvider: ConfigProvider) {}

  @postConstruct()
  public async init() {
    const botpressConfig = await this.configProvider.getBotpressConfig()
    this._allowStats = botpressConfig.allowStats || true // Stats are activated by default

    const mid = await machineId().catch(() => {
      const hash = crypto.createHash('sha256')
      hash.update(os.arch() + os.hostname() + os.platform() + os.type())
      return hash.digest('hex')
    })

    this._visitor = ua('UA-90044826-3', mid, { strictCidFormat: false })
    this._queued.forEach(event => event())
    this._queued = []
  }

  public track(category: StatsCategory, action: string, label: string = '', value: string | number = '') {
    if (!this._allowStats) {
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
