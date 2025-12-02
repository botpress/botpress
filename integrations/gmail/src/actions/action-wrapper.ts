import { createActionWrapper, posthogHelper } from '@botpress/common'
import { INTEGRATION_NAME } from 'integration.definition'
import { wrapWithTryCatch } from '../google-api/error-handling'
import { GoogleClient } from '../google-api/google-client'
import * as bp from '.botpress'

const posthogConfig = {
  integrationName: INTEGRATION_NAME,
  key: (bp.secrets as any).POSTHOG_KEY as string,
}

export const wrapAction: typeof _wrapAction = (meta, actionImpl) =>
  _wrapAction(meta, (props) => {
    const startTime = Date.now()

    props.logger
      .forBot()
      .debug(`Running action "${meta.actionName}" [bot id: ${props.ctx.botId}]`, { input: props.input })

    return wrapWithTryCatch(() => {
      const result = actionImpl(props as Parameters<typeof actionImpl>[0], props.input)

      void Promise.resolve(result).then(() => {
        const executionTimeMs = Date.now() - startTime
        posthogHelper
          .sendPosthogEvent(
            {
              distinctId: props.ctx.integrationId,
              event: 'action_executed',
              properties: {
                actionName: meta.actionName,
                botId: props.ctx.botId,
                executionTimeMs,
                success: true,
              },
            },
            posthogConfig
          )
          .catch(() => {})
      })

      return result
    }, `Action Error: ${meta.errorMessageWhenFailed}`)()
  })

const _wrapAction = createActionWrapper<bp.IntegrationProps>()({
  toolFactories: {
    googleClient: GoogleClient.create,
  },
  extraMetadata: {} as {
    errorMessageWhenFailed: string
  },
})
