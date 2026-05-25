import { createActionWrapper } from '@botpress/common'
import { SharepointClient } from './SharepointClient'
import * as bp from '.botpress'

export const wrapAction = createActionWrapper<bp.IntegrationProps>()({
  toolFactories: {
    sharepointClient: ({ ctx }: { ctx: bp.Context }) => new SharepointClient(ctx.configuration),
  },
})
