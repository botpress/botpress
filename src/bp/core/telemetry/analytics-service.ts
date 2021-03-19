import { gaId, machineUUID } from 'common/stats'
import { TYPES } from 'core/app/types'
import { ConfigProvider } from 'core/config'
import { inject, injectable, postConstruct } from 'inversify'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import ua, { Visitor } from 'universal-analytics'

@injectable()
export class AnalyticsService {
  private _visitor: Visitor | undefined
  private _queued: Function[] = []
  private _sendUsageStats!: boolean

  constructor(@inject(TYPES.ConfigProvider) private configProvider: ConfigProvider) {}

  @postConstruct()
  public async init() {
    await AppLifecycle.waitFor(AppLifecycleEvents.CONFIGURATION_LOADED)
    const botpressConfig = await this.configProvider.getBotpressConfig()
    this._sendUsageStats = botpressConfig.sendUsageStats

    const uuid = await machineUUID()
    this._visitor = ua(gaId, uuid, { strictCidFormat: false })
    this._queued.forEach(event => event())
    this._queued = []
  }

  /**
   * Send an event to Google Analytics
   * @param category Typically the object that was interacted with (e.g. 'Video')
   * @param action The type of interaction (e.g. 'play')
   * @param label Useful for categorizing events (e.g. 'Fall Campaign')
   * @param value A numeric value associated with the event (e.g. 42)
   */
  public track(category: string, action: string, label: string = '', value: string | number = '') {
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
