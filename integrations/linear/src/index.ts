import * as sdk from '@botpress/sdk'
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
  channels,
  actions: {
    ...actions,
    issueCreate: async (props) => {
      const defaults: bp.actions.createIssue.input.Input = {
        title: '',
        description: '',
        teamName: '',
      }

      const res = await actions.createIssue({
        ...props,
        type: 'createIssue',
        input: {
          ...defaults,
          ...props.input,
        },
      })

      return {
        item: res.issue,
      }
    },
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
    issueUpdate: async (props) => {
      const res = await actions.updateIssue({
        ...props,
        type: 'updateIssue',
        input: {
          issueId: props.input.id,
        },
      })

      if (!res.issue) {
        throw new sdk.RuntimeError('Issue not found')
      }

      return {
        item: res.issue,
      }
    },
    issueRead: async (props) => {
      const res = await actions.getIssue({
        ...props,
        type: 'getIssue',
        input: {
          issueId: props.input.id,
        },
      })

      return {
        item: res,
      }
    },
  },
})

export default sentryHelpers.wrapIntegration(integration, {
  dsn: bp.secrets.SENTRY_DSN,
  environment: bp.secrets.SENTRY_ENVIRONMENT,
  release: bp.secrets.SENTRY_RELEASE,
})
