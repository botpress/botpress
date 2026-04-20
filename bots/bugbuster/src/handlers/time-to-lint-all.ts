import * as boot from '../bootstrap'
import * as bp from '.botpress'

export const handleTimeToLintAll: bp.EventHandlers['timeToLintAll'] = async (props) => {
  const { client, logger } = props
  logger.info("'timeToLintAll' event received.")

  const { botpress } = boot.bootstrap(props)

  const _handleError = (context: string) => (thrown: unknown) => botpress.handleError({ context }, thrown)

  await client
    .getOrCreateWorkflow({
      name: 'lintAll',
      input: {},
      discriminateByStatusGroup: 'active',
      status: 'pending',
    })
    .catch(_handleError("trying to start the 'lintAll' workflow"))
}
