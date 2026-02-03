import { falsy, truthy } from '@stoplight/spectral-functions'
import { preprocessRuleset } from '../ruleset-functions'
import { descriptionFallbackExtractor, titleFallbackExtractor, truthyWithMessage } from '../spectral-functions'

export const INTEGRATION_RULESET = preprocessRuleset({
  extends: [],
  rules: {
    'integration-title-must-be-present': {
      description: 'The integration {{callToAction}} have a non-empty title',
      severity: 'error',
      given: '$',
      then: [{ field: 'title', function: truthy }],
    },
    'integration-description-must-be-present': {
      description: 'The integration {{callToAction}} have a non-empty description',
      severity: 'error',
      given: '$',
      then: [{ field: 'description', function: truthy }],
    },
    'integration-must-have-an-icon': {
      description: 'The integration {{callToAction}} have an icon',
      severity: 'error',
      given: '$',
      then: [{ field: 'icon', function: truthy }],
    },
    'integration-must-have-a-readme-file': {
      description: 'The integration {{callToAction}} have a readme file',
      severity: 'error',
      given: '$',
      then: [{ field: 'readme', function: truthy }],
    },
    'actions-should-have-a-title': {
      description: 'All actions {{callToAction}} have a title',
      message: '{{description}}: {{error}} {{callToAction}} have a non-empty title',
      severity: 'warn',
      given: '$.actions[*]',
      then: [{ field: 'title', function: truthyWithMessage(({ path }) => `action "${path[1]}"`) }],
    },
    'actions-must-have-a-description': {
      description: 'All actions {{callToAction}} have a description',
      message: '{{description}}: {{error}} {{callToAction}} have a non-empty description',
      severity: 'error',
      given: '$.actions[*]',
      then: [{ field: 'description', function: truthyWithMessage(({ path }) => `action "${path[1]}"`) }],
    },
    'action-inputparams-should-have-a-title': {
      description: 'All action input parameters {{callToAction}} have a title',
      message:
        '{{description}}: {{error}} {{callToAction}} provide a non-empty title by using .title() in its Zod schema',
      severity: 'warn',
      given: '$.actions[*].input..schema.properties[*]',
      then: [
        {
          field: 'x-zui.title',
          function: truthyWithMessage({
            failMsgMapper: ({ path, isFallback }) =>
              `input parameter "${path.at(isFallback ? -5 : -3)}" of action "${path[1]}"`,
            fallbackExtractor: titleFallbackExtractor,
          }),
        },
      ],
    },
    'action-inputparams-must-have-a-description': {
      description: 'All action input parameters {{callToAction}} have a description',
      message:
        '{{description}}: {{error}} {{callToAction}} provide a non-empty description by using .describe() in its Zod schema',
      severity: 'error',
      given: '$.actions[*].input..schema.properties[*]',
      then: [
        {
          field: 'description',
          function: truthyWithMessage({
            failMsgMapper: ({ path, isFallback }) =>
              `input parameter "${path.at(isFallback ? -4 : -2)}" of action "${path[1]}"`,
            fallbackExtractor: descriptionFallbackExtractor,
          }),
        },
      ],
    },
    'action-outputparams-should-have-a-title': {
      description: 'All action output parameters {{callToAction}} have a title',
      message:
        '{{description}}: {{error}} {{callToAction}} provide a non-empty title by using .title() in its Zod schema',
      severity: 'warn',
      given: '$.actions[*].output..schema.properties[*].x-zui',
      then: [
        {
          field: 'title',
          function: truthyWithMessage({
            failMsgMapper: ({ path, isFallback }) =>
              `output parameter "${path.at(isFallback ? -5 : -3)}" of action "${path[1]}"`,
            fallbackExtractor: titleFallbackExtractor,
          }),
        },
      ],
    },
    'action-outputparams-must-have-a-description': {
      description: 'All action output parameters {{callToAction}} have a description',
      message:
        '{{description}}: {{error}} {{callToAction}} provide a non-empty description by using .describe() in its Zod schema',
      severity: 'error',
      given: '$.actions[*].output..schema.properties[*]',
      then: [
        {
          field: 'description',
          function: truthyWithMessage({
            failMsgMapper: ({ path, isFallback }) =>
              `output parameter "${path.at(isFallback ? -4 : -2)}" of action "${path[1]}"`,
            fallbackExtractor: descriptionFallbackExtractor,
          }),
        },
      ],
    },
    'event-outputparams-should-have-title': {
      description: 'All event output parameters {{callToAction}} have a title',
      message:
        '{{description}}: {{error}} {{callToAction}} provide a non-empty title by using .title() in its Zod schema',
      severity: 'warn',
      given: '$.events[*]..schema.properties[*]',
      then: [
        {
          field: 'x-zui.title',
          function: truthyWithMessage({
            failMsgMapper: ({ path, isFallback }) =>
              `output parameter "${path.at(isFallback ? -5 : -3)}" of event "${path[1]}"`,
            fallbackExtractor: titleFallbackExtractor,
          }),
        },
      ],
    },
    'event-outputparams-must-have-description': {
      description: 'All event output parameters {{callToAction}} have a description',
      message:
        '{{description}}: {{error}} {{callToAction}} provide a non-empty description by using .describe() in its Zod schema',
      severity: 'error',
      given: '$.events[*]..schema.properties[*]',
      then: [
        {
          field: 'description',
          function: truthyWithMessage({
            failMsgMapper: ({ path, isFallback }) =>
              `output parameter "${path.at(isFallback ? -4 : -2)}" of event "${path[1]}"`,
            fallbackExtractor: descriptionFallbackExtractor,
          }),
        },
      ],
    },
    'events-must-have-a-title': {
      description: 'All events {{callToAction}} have a title',
      message: '{{description}}: {{error}} {{callToAction}} be a non-empty string',
      severity: 'error',
      given: '$.events[*]',
      then: [{ field: 'title', function: truthyWithMessage(({ path }) => `event "${path[1]}"`) }],
    },
    'events-must-have-a-description': {
      description: 'All events {{callToAction}} have a description',
      message: '{{description}}: {{error}} {{callToAction}} be a non-empty string',
      severity: 'error',
      given: '$.events[*]',
      then: [{ field: 'description', function: truthyWithMessage(({ path }) => `event "${path[1]}"`) }],
    },
    'consider-migrating-to-configurations': {
      description:
        'Consider migrating to the new multiple configuration format: you MAY move your configuration from "configuration" to "configurations" and remove the "configuration" property',
      severity: 'off',
      given: '$',
      then: [
        { field: 'configuration', function: falsy },
        { field: 'configurations', function: truthy },
      ],
    },
    'configuration-fields-must-have-a-title': {
      description: 'All configuration fields {{callToAction}} have a title',
      message:
        '{{description}}: {{error}} {{callToAction}} provide a non-empty title by using .title() in its Zod schema',
      severity: 'error',
      given: '$.configuration..schema.properties[*].x-zui',
      then: [
        {
          field: 'title',
          function: truthyWithMessage({
            failMsgMapper: ({ path, isFallback }) => `configuration parameter "${path.at(isFallback ? -5 : -3)}"`,
            fallbackExtractor: titleFallbackExtractor,
          }),
        },
      ],
    },
    'configuration-fields-must-have-a-description': {
      description: 'All configuration fields {{callToAction}} have a description',
      message:
        '{{description}}: {{error}} {{callToAction}} provide a non-empty description by using .describe() in its Zod schema',
      severity: 'error',
      given: '$.configuration..schema.properties[*]',
      then: [
        {
          field: 'description',
          function: truthyWithMessage({
            failMsgMapper: ({ path, isFallback }) => `configuration parameter "${path.at(isFallback ? -4 : -2)}"`,
            fallbackExtractor: descriptionFallbackExtractor,
          }),
        },
      ],
    },
    'multiple-configurations-must-have-a-title': {
      description: 'Multiple configuration definitions {{callToAction}} have a title',
      message: '{{description}}: {{error}} {{callToAction}} have a title',
      severity: 'error',
      given: '$.configurations[*]',
      then: [{ field: 'title', function: truthyWithMessage(({ path }) => `configuration "${path[1]}"`) }],
    },
    'multiple-configurations-must-have-a-description': {
      description: 'Multiple configuration definitions {{callToAction}} have a description',
      message: '{{description}}: {{error}} {{callToAction}} have a description',
      severity: 'error',
      given: '$.configurations[*]',
      then: [{ field: 'description', function: truthyWithMessage(({ path }) => `configuration "${path[1]}"`) }],
    },
    'multipes-configurations-fields-must-have-a-title': {
      description: 'All configuration fields in multiple configurations {{callToAction}} have a title',
      message:
        '{{description}}: {{error}} {{callToAction}} provide a non-empty title by using .title() in its Zod schema',
      severity: 'error',
      given: '$.configurations[*]..schema.properties[*].x-zui',
      then: [
        {
          field: 'title',
          function: truthyWithMessage({
            failMsgMapper: ({ path, isFallback }) =>
              `configuration field "${path.at(isFallback ? -5 : -3)}" of configuration "${path[1]}"`,
            fallbackExtractor: titleFallbackExtractor,
          }),
        },
      ],
    },
    'multipes-configurations-fields-must-have-a-description': {
      description: 'All configuration fields in multiple configurations {{callToAction}} have a description',
      message:
        '{{description}}: {{error}} {{callToAction}} provide a non-empty description by using .describe() in its Zod schema',
      severity: 'error',
      given: '$.configurations[*]..schema.properties[*]',
      then: [
        {
          field: 'description',
          function: truthyWithMessage({
            failMsgMapper: ({ path, isFallback }) =>
              `configuration field "${path.at(isFallback ? -4 : -2)}" of configuration "${path[1]}"`,
            fallbackExtractor: descriptionFallbackExtractor,
          }),
        },
      ],
    },
    'user-tags-should-have-a-title': {
      description: 'All user tags {{callToAction}} have a title',
      message: '{{description}}: {{error}} {{callToAction}} have a non-empty title',
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
      description: 'All user tags {{callToAction}} have a description',
      message: '{{description}}: {{error}} {{callToAction}} have a non-empty description',
      severity: 'error',
      given: '$.user.tags[*]',
      then: [
        {
          field: 'description',
          function: truthyWithMessage(({ path }) => `user tag "${path[2]}"`),
        },
      ],
    },
    'channels-should-have-a-title': {
      description: 'All channels {{callToAction}} have a title',
      message: '{{description}}: {{error}} {{callToAction}} have a non-empty title',
      severity: 'warn',
      given: '$.channels[*]',
      then: [
        {
          field: 'title',
          function: truthyWithMessage(({ path }) => `channel "${path[1]}"`),
        },
      ],
    },
    'channels-must-have-a-description': {
      description: 'All channels {{callToAction}} have a description',
      message: '{{description}}: {{error}} {{callToAction}} have a non-empty description',
      severity: 'error',
      given: '$.channels[*]',
      then: [
        {
          field: 'description',
          function: truthyWithMessage(({ path }) => `channel "${path[1]}"`),
        },
      ],
    },
    'channels-conversation-tags-should-have-a-title': {
      description: 'All conversation tags {{callToAction}} have a title',
      message: '{{description}}: {{error}} {{callToAction}} have a non-empty title',
      severity: 'warn',
      given: '$.channels[*].conversation.tags[*]',
      then: [
        {
          field: 'title',
          function: truthyWithMessage(({ path }) => `conversation tag "${path.at(-2)}" of channel "${path[1]}"`),
        },
      ],
    },
    'channels-conversation-tags-must-have-a-description': {
      description: 'All conversation tags {{callToAction}} have a description',
      message: '{{description}}: {{error}} {{callToAction}} have a non-empty description',
      severity: 'error',
      given: '$.channels[*].conversation.tags[*]',
      then: [
        {
          field: 'description',
          function: truthyWithMessage(({ path }) => `conversation tag "${path.at(-2)}" of channel "${path[1]}"`),
        },
      ],
    },
    'channels-message-tags-should-have-a-title': {
      description: 'All message tags {{callToAction}} have a title',
      message: '{{description}}: {{error}} {{callToAction}} have a non-empty title',
      severity: 'warn',
      given: '$.channels[*].message.tags[*]',
      then: [
        {
          field: 'title',
          function: truthyWithMessage(({ path }) => `message tag "${path.at(-2)}" of channel "${path[1]}"`),
        },
      ],
    },
    'channels-message-tags-must-have-a-description': {
      description: 'All message tags {{callToAction}} have a description',
      message: '{{description}}: {{error}} {{callToAction}} have a non-empty description',
      severity: 'error',
      given: '$.channels[*].message.tags[*]',
      then: [
        {
          field: 'description',
          function: truthyWithMessage(({ path }) => `message tag "${path.at(-2)}" of channel "${path[1]}"`),
        },
      ],
    },
    'legacy-zui-title-should-be-removed': {
      description:
        'Legacy ZUI title fields (ui.title) {{callToAction}} be removed. Please use .title() in your Zod schemas instead',
      severity: 'error',
      given: '$..ui[*].title',
      then: [{ function: falsy }],
    },
    'legacy-zui-examples-should-be-removed': {
      description:
        'Legacy ZUI examples fields (ui.examples) {{callToAction}} be removed. There are currently no alternatives',
      severity: 'hint',
      given: '$..ui[*].examples',
      then: [{ function: falsy }],
    },
    'state-fields-should-have-title': {
      description: 'All state fields {{callToAction}} have a title',
      message:
        '{{description}}: {{error}} {{callToAction}} provide a non-empty title by using .title() in its Zod schema',
      severity: 'warn',
      given: '$.states[*]..schema.properties[*]',
      then: [
        {
          field: 'x-zui.title',
          function: truthyWithMessage({
            failMsgMapper: ({ path, isFallback }) => `field "${path.at(isFallback ? -5 : -3)}" of state "${path[1]}"`,
            fallbackExtractor: titleFallbackExtractor,
          }),
        },
      ],
    },
    'state-fields-must-have-description': {
      description: 'All state fields {{callToAction}} have a description',
      message:
        '{{description}}: {{error}} {{callToAction}} provide a non-empty description by using .describe() in its Zod schema',
      severity: 'error',
      given: '$.states[*]..schema.properties[*]',
      then: [
        {
          field: 'description',
          function: truthyWithMessage({
            failMsgMapper: ({ path, isFallback }) => `field "${path.at(isFallback ? -4 : -2)}" of state "${path[1]}"`,
            fallbackExtractor: descriptionFallbackExtractor,
          }),
        },
      ],
    },
    'secrets-must-have-a-description': {
      description: 'All secrets {{callToAction}} have a description',
      message: '{{description}}: {{error}} {{callToAction}} have a non-empty description',
      severity: 'error',
      given: '$.secrets[*]',
      then: [
        {
          field: 'description',
          function: truthyWithMessage(({ path }) => `secret "${path[1]}"`),
        },
      ],
    },
  },
})

/** An override of the base ruleset that checks nested properties for missing titles & descriptions
 *
 *  @remark This can be removed when the "--checkNested" flag is removed from the lint command
 *  @remark Look at the "--checkNested" flag implementation to see the removal conditions */
export const INTEGRATION_RULESET_WITH_NESTED_CHECKS = preprocessRuleset({
  ...INTEGRATION_RULESET,
  rules: {
    ...INTEGRATION_RULESET.rules,
    'action-inputparams-should-have-a-title': {
      description: 'All action input parameters {{callToAction}} have a title',
      message:
        '{{description}}: {{error}} {{callToAction}} provide a non-empty title by using .title() in its Zod schema',
      severity: 'warn',
      given: '$.actions[*].input..schema..properties[*]',
      then: [
        {
          field: 'x-zui.title',
          function: truthyWithMessage({
            failMsgMapper: ({ path, isFallback }) =>
              `input parameter "${path.at(isFallback ? -5 : -3)}" of action "${path[1]}"`,
            fallbackExtractor: titleFallbackExtractor,
          }),
        },
      ],
    },
    'action-inputparams-must-have-a-description': {
      description: 'All action input parameters {{callToAction}} have a description',
      message:
        '{{description}}: {{error}} {{callToAction}} provide a non-empty description by using .describe() in its Zod schema',
      severity: 'error',
      given: '$.actions[*].input..schema..properties[*]',
      then: [
        {
          field: 'description',
          function: truthyWithMessage({
            failMsgMapper: ({ path, isFallback }) =>
              `input parameter "${path.at(isFallback ? -4 : -2)}" of action "${path[1]}"`,
            fallbackExtractor: descriptionFallbackExtractor,
          }),
        },
      ],
    },
    'action-outputparams-should-have-a-title': {
      description: 'All action output parameters {{callToAction}} have a title',
      message:
        '{{description}}: {{error}} {{callToAction}} provide a non-empty title by using .title() in its Zod schema',
      severity: 'warn',
      given: '$.actions[*].output..schema..properties[*].x-zui',
      then: [
        {
          field: 'title',
          function: truthyWithMessage({
            failMsgMapper: ({ path, isFallback }) =>
              `output parameter "${path.at(isFallback ? -5 : -3)}" of action "${path[1]}"`,
            fallbackExtractor: titleFallbackExtractor,
          }),
        },
      ],
    },
    'action-outputparams-must-have-a-description': {
      description: 'All action output parameters {{callToAction}} have a description',
      message:
        '{{description}}: {{error}} {{callToAction}} provide a non-empty description by using .describe() in its Zod schema',
      severity: 'error',
      given: '$.actions[*].output..schema..properties[*]',
      then: [
        {
          field: 'description',
          function: truthyWithMessage({
            failMsgMapper: ({ path, isFallback }) =>
              `output parameter "${path.at(isFallback ? -4 : -2)}" of action "${path[1]}"`,
            fallbackExtractor: descriptionFallbackExtractor,
          }),
        },
      ],
    },
    'event-outputparams-should-have-title': {
      description: 'All event output parameters {{callToAction}} have a title',
      message:
        '{{description}}: {{error}} {{callToAction}} provide a non-empty title by using .title() in its Zod schema',
      severity: 'warn',
      given: '$.events[*]..schema..properties[*]',
      then: [
        {
          field: 'x-zui.title',
          function: truthyWithMessage({
            failMsgMapper: ({ path, isFallback }) =>
              `output parameter "${path.at(isFallback ? -5 : -3)}" of event "${path[1]}"`,
            fallbackExtractor: titleFallbackExtractor,
          }),
        },
      ],
    },
    'event-outputparams-must-have-description': {
      description: 'All event output parameters {{callToAction}} have a description',
      message:
        '{{description}}: {{error}} {{callToAction}} provide a non-empty description by using .describe() in its Zod schema',
      severity: 'error',
      given: '$.events[*]..schema..properties[*]',
      then: [
        {
          field: 'description',
          function: truthyWithMessage({
            failMsgMapper: ({ path, isFallback }) =>
              `output parameter "${path.at(isFallback ? -4 : -2)}" of event "${path[1]}"`,
            fallbackExtractor: descriptionFallbackExtractor,
          }),
        },
      ],
    },
    'configuration-fields-must-have-a-title': {
      description: 'All configuration fields {{callToAction}} have a title',
      message:
        '{{description}}: {{error}} {{callToAction}} provide a non-empty title by using .title() in its Zod schema',
      severity: 'error',
      given: '$.configuration..schema..properties[*].x-zui',
      then: [
        {
          field: 'title',
          function: truthyWithMessage({
            failMsgMapper: ({ path, isFallback }) => `configuration parameter "${path.at(isFallback ? -5 : -3)}"`,
            fallbackExtractor: titleFallbackExtractor,
          }),
        },
      ],
    },
    'configuration-fields-must-have-a-description': {
      description: 'All configuration fields {{callToAction}} have a description',
      message:
        '{{description}}: {{error}} {{callToAction}} provide a non-empty description by using .describe() in its Zod schema',
      severity: 'error',
      given: '$.configuration..schema..properties[*]',
      then: [
        {
          field: 'description',
          function: truthyWithMessage({
            failMsgMapper: ({ path, isFallback }) => `configuration parameter "${path.at(isFallback ? -4 : -2)}"`,
            fallbackExtractor: descriptionFallbackExtractor,
          }),
        },
      ],
    },
    'multipes-configurations-fields-must-have-a-title': {
      description: 'All configuration fields in multiple configurations {{callToAction}} have a title',
      message:
        '{{description}}: {{error}} {{callToAction}} provide a non-empty title by using .title() in its Zod schema',
      severity: 'error',
      given: '$.configurations[*]..schema..properties[*].x-zui',
      then: [
        {
          field: 'title',
          function: truthyWithMessage({
            failMsgMapper: ({ path, isFallback }) =>
              `configuration field "${path.at(isFallback ? -5 : -3)}" of configuration "${path[1]}"`,
            fallbackExtractor: titleFallbackExtractor,
          }),
        },
      ],
    },
    'multipes-configurations-fields-must-have-a-description': {
      description: 'All configuration fields in multiple configurations {{callToAction}} have a description',
      message:
        '{{description}}: {{error}} {{callToAction}} provide a non-empty description by using .describe() in its Zod schema',
      severity: 'error',
      given: '$.configurations[*]..schema..properties[*]',
      then: [
        {
          field: 'description',
          function: truthyWithMessage({
            failMsgMapper: ({ path, isFallback }) =>
              `configuration field "${path.at(isFallback ? -4 : -2)}" of configuration "${path[1]}"`,
            fallbackExtractor: descriptionFallbackExtractor,
          }),
        },
      ],
    },
    'state-fields-should-have-title': {
      description: 'All state fields {{callToAction}} have a title',
      message:
        '{{description}}: {{error}} {{callToAction}} provide a non-empty title by using .title() in its Zod schema',
      severity: 'warn',
      given: '$.states[*]..schema..properties[*]',
      then: [
        {
          field: 'x-zui.title',
          function: truthyWithMessage({
            failMsgMapper: ({ path, isFallback }) => `field "${path.at(isFallback ? -5 : -3)}" of state "${path[1]}"`,
            fallbackExtractor: titleFallbackExtractor,
          }),
        },
      ],
    },
    'state-fields-must-have-description': {
      description: 'All state fields {{callToAction}} have a description',
      message:
        '{{description}}: {{error}} {{callToAction}} provide a non-empty description by using .describe() in its Zod schema',
      severity: 'error',
      given: '$.states[*]..schema..properties[*]',
      then: [
        {
          field: 'description',
          function: truthyWithMessage({
            failMsgMapper: ({ path, isFallback }) => `field "${path.at(isFallback ? -4 : -2)}" of state "${path[1]}"`,
            fallbackExtractor: descriptionFallbackExtractor,
          }),
        },
      ],
    },
  },
})
