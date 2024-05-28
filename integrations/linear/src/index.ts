import { sentry as sentryHelpers } from '@botpress/sdk-addons'

import actions from './actions'
import channels from './channels'
import { handler } from './handler'
import { createConversation, register, unregister } from './setup'
import * as bp from '.botpress'

const integration = new bp.Integration({
  register,
  unregister,
  handler,
  createConversation,
  actions: {
    ...actions,
    'issue.create': async (props) => {
      const res = await actions.createIssue({
        ...props,
        type: 'createIssue',
        input: { description: props.input.description ?? '', teamName: '', title: props.input.title },
      })
      return {
        item: res.issue,
      }
    },
    'issue.list': async (props) => {
      const res = await actions.listIssues({
        ...props,
        type: 'listIssues',
        input: { count: 0 },
      })
      return {
        items: res.issues,
        meta: { nextToken: undefined },
      }
    },
    'project.create': async () => {
      return {
        item: {
          id: '1',
          name: 'Test Project',
        },
      }
    },
    'project.list': async () => {
      return {
        items: [
          {
            id: '1',
            name: 'Test Project',
          },
        ],
        meta: { nextToken: undefined },
      }
    },
  },
  channels,
})

export default sentryHelpers.wrapIntegration(integration, {
  dsn: bp.secrets.SENTRY_DSN,
  environment: bp.secrets.SENTRY_ENVIRONMENT,
  release: bp.secrets.SENTRY_RELEASE,
})
