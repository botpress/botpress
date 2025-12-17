import { createAsyncFnWrapperWithErrorRedaction, defaultErrorRedactor } from '@botpress/common'
import { UberEatsClient } from 'src/api'
import * as bp from '.botpress'

const withTryCatch = createAsyncFnWrapperWithErrorRedaction(defaultErrorRedactor)

export const wrapUberAction = <TProps extends bp.AnyActionProps, TResult>(
  fn: (props: TProps & { uber: UberEatsClient }) => Promise<TResult>,
  errorMessage: string
) =>
  withTryCatch(async (props: TProps): Promise<TResult> => {
    const uber = new UberEatsClient({
      clientId: props.ctx.configuration.clientId,
      clientSecret: props.ctx.configuration.clientSecret,
      bpClient: props.client,
      ctx: props.ctx,
      logger: props.logger,
    })

    return fn({ ...props, uber })
  }, errorMessage)
