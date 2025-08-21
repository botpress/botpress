import { TIntegration } from '.botpress'
import { Input } from '.botpress/implementation/typings/actions/generateLink/input'
import { ActionHandlerProps } from '@botpress/sdk/dist/integration'
import { CalcomApi } from 'src/calcom.api'

export async function generateLink(
  props: ActionHandlerProps<TIntegration, 'generateLink', Input>
): Promise<{ url: string }> {
  const { client, input, ctx } = props

  const calcom = new CalcomApi(ctx.configuration.calcomApiKey, props.logger.forBot())
  const url = await calcom.generateLink()

  //register webhook
  props.logger.forBot().debug('calcom::generateLink - webhook', url, ctx.webhookId)

  return {
    url,
  }
}
