import { createAsyncFnWrapperWithErrorRedaction, defaultErrorRedactor } from '@botpress/common'
import * as bp from '.botpress'
import { UberEatsClient } from '@/api/uber-client'

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
    })

    return fn({ ...props, uber })
  }, errorMessage)
