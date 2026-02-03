import { falsy } from '@stoplight/spectral-functions'
import { preprocessRuleset } from '../ruleset-functions'
import { descriptionFallbackExtractor, titleFallbackExtractor, truthyWithMessage } from '../spectral-functions'

export const INTERFACE_RULESET = preprocessRuleset({
  extends: [],
  rules: {
    'action-inputparams-should-have-a-title': {
      description: 'All action input parameters {{callToAction}} have a title',
      message:
        '{{description}}: {{error}} {{callToAction}} provide a non-empty title by using .title() in its Zod schema',
      severity: 'warn',
      given: '$.actions[*].input..schema.properties[*].x-zui',
      then: [
        {
          field: 'title',
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
    'entity-fields-should-have-a-title': {
      description: 'All entity fields {{callToAction}} have a title',
      message:
        '{{description}}: {{error}} {{callToAction}} provide a non-empty title by using .title() in its Zod schema',
      severity: 'warn',
      given: '$.entities[*]..schema.properties[*]',
      then: [
        {
          field: 'x-zui.title',
          function: truthyWithMessage({
            failMsgMapper: ({ path, isFallback }) => `field "${path.at(isFallback ? -5 : -3)}" of entity "${path[1]}"`,
            fallbackExtractor: titleFallbackExtractor,
          }),
        },
      ],
    },
    'entity-fields-must-have-a-description': {
      description: 'All entity fields {{callToAction}} have a description',
      message:
        '{{description}}: {{error}} {{callToAction}} provide a non-empty description by using .describe() in its Zod schema',
      severity: 'error',
      given: '$.entities[*]..schema.properties[*]',
      then: [
        {
          field: 'description',
          function: truthyWithMessage({
            failMsgMapper: ({ path, isFallback }) => `field "${path.at(isFallback ? -4 : -2)}" of entity "${path[1]}"`,
            fallbackExtractor: descriptionFallbackExtractor,
          }),
        },
      ],
    },
  },
})

/** An override of the base ruleset that checks nested properties for missing titles & descriptions
 *
 *  @remark This can be removed when the "--checkNested" flag is removed from the lint command
 *  @remark Look at the "--checkNested" flag implementation to see the removal conditions */
export const INTERFACE_RULESET_WITH_NESTED_CHECKS = preprocessRuleset({
  ...INTERFACE_RULESET,
  rules: {
    ...INTERFACE_RULESET.rules,
    'action-inputparams-should-have-a-title': {
      description: 'All action input parameters SHOULD have a title',
      message: '{{description}}: {{error}} SHOULD provide a non-empty title by using .title() in its Zod schema',
      severity: 'warn',
      given: '$.actions[*].input..schema..properties[*].x-zui',
      then: [
        {
          field: 'title',
          function: truthyWithMessage({
            failMsgMapper: ({ path, isFallback }) =>
              `input parameter "${path.at(isFallback ? -5 : -3)}" of action "${path[1]}"`,
            fallbackExtractor: titleFallbackExtractor,
          }),
        },
      ],
    },
    'action-inputparams-must-have-a-description': {
      description: 'All action input parameters MUST have a description',
      message: '{{description}}: {{error}} MUST provide a non-empty description by using .describe() in its Zod schema',
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
      description: 'All action output parameters SHOULD have a title',
      message: '{{description}}: {{error}} SHOULD provide a non-empty title by using .title() in its Zod schema',
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
      description: 'All action output parameters MUST have a description',
      message: '{{description}}: {{error}} MUST provide a non-empty description by using .describe() in its Zod schema',
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
      description: 'All event output parameters SHOULD have a title',
      message: '{{description}}: {{error}} SHOULD provide a non-empty title by using .title() in its Zod schema',
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
      description: 'All event output parameters MUST have a description',
      message:
        '{{description}}: {{error}} SHOULD provide a non-empty description by using .describe() in its Zod schema',
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
    'entity-fields-should-have-a-title': {
      description: 'All entity fields SHOULD have a title',
      message: '{{description}}: {{error}} SHOULD provide a non-empty title by using .title() in its Zod schema',
      severity: 'warn',
      given: '$.entities[*]..schema..properties[*]',
      then: [
        {
          field: 'x-zui.title',
          function: truthyWithMessage({
            failMsgMapper: ({ path, isFallback }) => `field "${path.at(isFallback ? -5 : -3)}" of entity "${path[1]}"`,
            fallbackExtractor: titleFallbackExtractor,
          }),
        },
      ],
    },
    'entity-fields-must-have-a-description': {
      description: 'All entity fields MUST have a description',
      message: '{{description}}: {{error}} MUST provide a non-empty description by using .describe() in its Zod schema',
      severity: 'error',
      given: '$.entities[*]..schema..properties[*]',
      then: [
        {
          field: 'description',
          function: truthyWithMessage({
            failMsgMapper: ({ path, isFallback }) => `field "${path.at(isFallback ? -4 : -2)}" of entity "${path[1]}"`,
            fallbackExtractor: descriptionFallbackExtractor,
          }),
        },
      ],
    },
  },
})
