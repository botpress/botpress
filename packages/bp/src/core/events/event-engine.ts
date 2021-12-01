import { runtime } from '@botpress/runtime'
import * as sdk from 'botpress/sdk'
import { TYPES } from 'core/app/types'
import { inject, injectable, tagged } from 'inversify'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import _ from 'lodash'

@injectable()
export class EventEngine {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'EventEngine')
    private logger: sdk.Logger
  ) {}

  // We must wait until the runtime is initialized, to ensure we catch all registration events
  async register(middleware: sdk.IO.MiddlewareDefinition) {
    await AppLifecycle.waitFor(AppLifecycleEvents.RUNTIME_INITIALIZED)
    return runtime.events.registerMiddleware(middleware)
  }

  async removeMiddleware(middlewareName: string): Promise<void> {
    await AppLifecycle.waitFor(AppLifecycleEvents.RUNTIME_INITIALIZED)
    return runtime.events.removeMiddleware(middlewareName)
  }

  async sendEvent(event: sdk.IO.Event): Promise<void> {
    return runtime.events.sendEvent(event)
  }
}
