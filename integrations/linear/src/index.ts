import { sentry as sentryHelpers } from '@botpress/sdk-addons'

import actions from './actions'
import channels from './channels'
import { handler } from './handler'
import { register, unregister } from './setup'
import * as bp from '.botpress'

const integration = new bp.Integration({
  register,
  unregister,
  handler,
  channels,
  actions: {
    ...actions,
    issueList: async (props) => {
      const count = 20
      const startCursor = props.input.nextToken
      const res = await actions.listIssues({
        ...props,
        type: 'listIssues',
        input: {
          count,
          startCursor,
        },
      })
      return {
        // eslint-disable-next-line unused-imports/no-unused-vars
        items: res.issues.map(({ linearIds, ...item }) => item),
        meta: { nextToken: res.nextCursor },
      }
    },
    issueDelete: async (props) => {
      return actions.deleteIssue({
        ...props,
        type: 'deleteIssue',
        input: { id: props.input.id },
      })
    },
  },
})

export default sentryHelpers.wrapIntegration(integration, {
  dsn: bp.secrets.SENTRY_DSN,
  environment: bp.secrets.SENTRY_ENVIRONMENT,
  release: bp.secrets.SENTRY_RELEASE,
})
