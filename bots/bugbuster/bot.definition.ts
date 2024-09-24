import * as sdk from '@botpress/sdk'
import github from '@botpresshub/github/integration.definition'
import slack from '@botpresshub/slack/integration.definition'

export default new sdk.BotDefinition({
  states: {
    listeners: {
      type: 'bot',
      schema: sdk.z.object({
        conversationIds: sdk.z.array(sdk.z.string()),
      }),
    },
  },
  events: {
    syncIssuesRequest: {
      schema: sdk.z.object({}),
    },
  },
  recurringEvents: {
    fetchIssues: {
      type: 'syncIssuesRequest',
      payload: {},
      schedule: { cron: '0 0/6 * * *' }, // every 6 hours
    },
  },
})
  .add(github, {
    enabled: true,
    configurationType: null,
    configuration: { owner: 'botpress', repo: 'botpress', token: '$TOKEN' },
  })
  .add(slack, {
    enabled: true,
    configurationType: null,
    configuration: {},
  })
