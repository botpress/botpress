import { type RulesetDefinition } from '@stoplight/spectral-core'
import { falsy } from '@stoplight/spectral-functions'
import { truthyWithMessage } from '../spectral-functions'

export const INTERFACE_RULESET = {
  extends: [],
  rules: {
    'action-inputparams-should-have-a-title': {
      description: 'All action input parameters SHOULD have a title',
      message: '{{description}}: {{error}} SHOULD provide a non-empty title by using .title() in its Zod schema',
      severity: 'warn',
      given: '$.actions[*].input..schema.properties[*].x-zui',
      then: [
        {
          field: 'title',
          function: truthyWithMessage(({ path }) => `input parameter "${path.at(-3)}" of action "${path[1]}"`),
        },
      ],
    },
    'action-inputparams-must-have-a-description': {
      description: 'All action input parameters MUST have a description',
      message: '{{description}}: {{error}} MUST provide a non-empty description by using .describe() in its Zod schema',
      severity: 'error',
      given: '$.actions[*].input..schema.properties[*]',
      then: [
        {
          field: 'description',
          function: truthyWithMessage(({ path }) => `input parameter "${path.at(-2)}" of action "${path[1]}"`),
        },
      ],
    },
    'action-outputparams-should-have-a-title': {
      description: 'All action output parameters SHOULD have a title',
      message: '{{description}}: {{error}} SHOULD provide a non-empty title by using .title() in its Zod schema',
      severity: 'warn',
      given: '$.actions[*].output..schema.properties[*].x-zui',
      then: [
        {
          field: 'title',
          function: truthyWithMessage(({ path }) => `output parameter "${path.at(-3)}" of action "${path[1]}"`),
        },
      ],
    },
    'action-outputparams-must-have-a-description': {
      description: 'All action output parameters MUST have a description',
      message: '{{description}}: {{error}} MUST provide a non-empty description by using .describe() in its Zod schema',
      severity: 'error',
      given: '$.actions[*].output..schema.properties[*]',
      then: [
        {
          field: 'description',
          function: truthyWithMessage(({ path }) => `output parameter "${path.at(-2)}" of action "${path[1]}"`),
        },
      ],
    },
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
    'entities-should-have-a-title': {
      description: 'All entities SHOULD have a title',
      message: '{{description}}: {{error}} SHOULD have a non-empty title',
      severity: 'warn',
      given: '$.entities[*]',
      then: [{ field: 'title', function: truthyWithMessage(({ path }) => `entity "${path[1]}"`) }],
    },
    'entities-must-have-a-description': {
      description: 'All entities MUST have a description',
      message: '{{description}}: {{error}} MUST have a non-empty description',
      severity: 'error',
      given: '$.entities[*]',
      then: [{ field: 'description', function: truthyWithMessage(({ path }) => `entity "${path[1]}"`) }],
    },
    'entity-fields-should-have-a-title': {
      description: 'All entity fields SHOULD have a title',
      message: '{{description}}: {{error}} SHOULD provide a non-empty title by using .title() in its Zod schema',
      severity: 'warn',
      given: '$.entities[*]..schema.properties[*]',
      then: [
        {
          field: 'x-zui.title',
          function: truthyWithMessage(({ path }) => `field "${path.at(-3)}" of entity "${path[1]}"`),
        },
      ],
    },
    'entity-fields-must-have-a-description': {
      description: 'All entity fields MUST have a description',
      message: '{{description}}: {{error}} MUST provide a non-empty description by using .describe() in its Zod schema',
      severity: 'error',
      given: '$.entities[*]..schema.properties[*]',
      then: [
        {
          field: 'description',
          function: truthyWithMessage(({ path }) => `field "${path.at(-2)}" of entity "${path[1]}"`),
        },
      ],
    },
  },
} satisfies RulesetDefinition
