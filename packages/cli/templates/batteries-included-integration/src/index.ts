import { ExampleActionExecutor } from './actions/example-action'
import { ExampleApiClient } from './api-client/api-client'
import { ExampleChannelPublisher } from './channels/example-channel'
import { ExampleEventHandler } from './events/example-event'
import { OAuthHandler } from './events/oauth-handler'
import { IntegrationBuilder } from './lib/integration-builder'

export default new IntegrationBuilder()
  .addActionExecutor('exampleAction', ExampleActionExecutor)
  .addChannelPublisher('exampleChannel', 'text', ExampleChannelPublisher)
  .addEventHandler(OAuthHandler)
  .addEventHandler(ExampleEventHandler)
  .setApiFacade(ExampleApiClient)
  .addRegisterFunction(async ({ logger }) => {
    // ... handle registration ...
    logger.forBot().info('Registering bot...')
  })
  .build()
