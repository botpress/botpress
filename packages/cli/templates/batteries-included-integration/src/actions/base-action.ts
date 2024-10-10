import { ExampleApiClient } from 'src/api-client/api-client'
import { ActionKey, BaseActionExecutor } from 'src/lib/actions/base-action-executor'

export abstract class BrandedActionExecutor<ActionName extends ActionKey> extends BaseActionExecutor<ActionName> {
  protected override get _apiFacade(): ExampleApiClient {
    return super._apiFacade as ExampleApiClient
  }
}
