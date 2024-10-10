import { BrandedWebhookEventHandler } from './base-event'

export class ExampleEventHandler extends BrandedWebhookEventHandler {
  public handlesEvent(): boolean {
    return this._json.type === 'exampleEvent'
  }

  public async processEvent(): Promise<void> {
    // ... handle example event ...
  }
}
