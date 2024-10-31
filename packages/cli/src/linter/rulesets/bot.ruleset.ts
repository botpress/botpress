import { type RulesetDefinition } from '@stoplight/spectral-core'
import { falsy } from '@stoplight/spectral-functions'
import { truthyWithMessage } from '../spectral-functions'

export const BOT_RULESET = {
  extends: [],
  rules: {
    'event-outputparams-should-have-title': {
      description: 'All event output parameters SHOULD have a title',
      message: '{{description}}: {{error}} SHOULD provide a non-empty title by using .title() in its Zod schema',
      severity: 'warn',
      given: '$.events[*]..schema.properties[*]',
      then: [
        {
          field: 'x-zui.title',
          function: truthyWithMessage(({ path }) => `output parameter "${path.at(-3)}" of event "${path[1]}"`),
        },
      ],
    },
    'event-outputparams-must-have-description': {
      description: 'All event output parameters MUST have a description',
      message:
        '{{description}}: {{error}} SHOULD provide a non-empty description by using .describe() in its Zod schema',
      severity: 'error',
      given: '$.events[*]..schema.properties[*]',
      then: [
        {
          field: 'description',
          function: truthyWithMessage(({ path }) => `output parameter "${path.at(-2)}" of event "${path[1]}"`),
        },
      ],
    },
    'configuration-fields-must-have-a-title': {
      description: 'All configuration fields MUST have a title',
      message: '{{description}}: {{error}} MUST provide a non-empty title by using .title() in its Zod schema',
      severity: 'error',
      given: '$.configuration..schema.properties[*].x-zui',
      then: [
        {
          field: 'title',
          function: truthyWithMessage(({ path }) => `configuration parameter "${path.at(-3)}"`),
        },
      ],
    },
    'configuration-fields-must-have-a-description': {
      description: 'All configuration fields MUST have a description',
      message: '{{description}}: {{error}} MUST provide a non-empty description by using .describe() in its Zod schema',
      severity: 'error',
      given: '$.configuration..schema.properties[*]',
      then: [
        {
          field: 'description',
          function: truthyWithMessage(({ path }) => `configuration parameter "${path.at(-2)}"`),
        },
      ],
    },
    'user-tags-should-have-a-title': {
      description: 'All user tags SHOULD have a title',
      message: '{{description}}: {{error}} SHOULD have a non-empty title',
      severity: 'warn',
      given: '$.user.tags[*]',
      then: [
        {
          field: 'title',
          function: truthyWithMessage(({ path }) => `user tag "${path[2]}"`),
        },
      ],
    },
    'user-tags-must-have-a-description': {
      description: 'All user tags MUST have a description',
      message: '{{description}}: {{error}} MUST have a non-empty description',
      severity: 'error',
      given: '$.user.tags[*]',
      then: [
        {
          field: 'description',
          function: truthyWithMessage(({ path }) => `user tag "${path[2]}"`),
        },
      ],
    },
    'conversation-tags-should-have-a-title': {
      description: 'All conversation tags SHOULD have a title',
      message: '{{description}}: {{error}} SHOULD have a non-empty title',
      severity: 'warn',
      given: '$.conversation.tags[*]',
      then: [
        {
          field: 'title',
          function: truthyWithMessage(({ path }) => `conversation tag "${path[2]}"`),
        },
      ],
    },
    'conversation-tags-must-have-a-description': {
      description: 'All conversation tags MUST have a description',
      message: '{{description}}: {{error}} MUST have a non-empty description',
      severity: 'error',
      given: '$.conversation.tags[*]',
      then: [
        {
          field: 'description',
          function: truthyWithMessage(({ path }) => `conversation tag "${path[2]}"`),
        },
      ],
    },
    'message-tags-should-have-a-title': {
      description: 'All message tags SHOULD have a title',
      message: '{{description}}: {{error}} SHOULD have a non-empty title',
      severity: 'warn',
      given: '$.message.tags[*]',
      then: [
        {
          field: 'title',
          function: truthyWithMessage(({ path }) => `message tag "${path[2]}"`),
        },
      ],
    },
    'message-tags-must-have-a-description': {
      description: 'All message tags MUST have a description',
      message: '{{description}}: {{error}} MUST have a non-empty description',
      severity: 'error',
      given: '$.message.tags[*]',
      then: [
        {
          field: 'description',
          function: truthyWithMessage(({ path }) => `message tag "${path[2]}"`),
        },
      ],
    },
    'legacy-zui-title-should-be-removed': {
      description:
        'Legacy ZUI title fields (ui.title) SHOULD be removed. Please use .title() in your Zod schemas instead',
      severity: 'error',
      given: '$..ui[*].title',
      then: [{ function: falsy }],
    },
    'legacy-zui-examples-should-be-removed': {
      description: 'Legacy ZUI examples fields (ui.examples) SHOULD be removed. There are currently no alternatives',
      severity: 'hint',
      given: '$..ui[*].examples',
      then: [{ function: falsy }],
    },
    'state-fields-should-have-title': {
      description: 'All state fields SHOULD have a title',
      message: '{{description}}: {{error}} SHOULD provide a non-empty title by using .title() in its Zod schema',
      severity: 'warn',
      given: '$.states[*]..schema.properties[*]',
      then: [
        {
          field: 'x-zui.title',
          function: truthyWithMessage(({ path }) => `field "${path.at(-3)}" of state "${path[1]}"`),
        },
      ],
    },
    'state-fields-must-have-description': {
      description: 'All state fields MUST have a description',
      message:
        '{{description}}: {{error}} SHOULD provide a non-empty description by using .describe() in its Zod schema',
      severity: 'error',
      given: '$.states[*]..schema.properties[*]',
      then: [
        {
          field: 'description',
          function: truthyWithMessage(({ path }) => `field "${path.at(-2)}" of state "${path[1]}"`),
        },
      ],
    },
  },
} satisfies RulesetDefinition
