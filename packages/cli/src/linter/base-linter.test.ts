import { test, expect, describe, vi } from 'vitest'
import { prepareCreateIntegrationBody } from '../api/integration-body'
import { IntegrationLinter } from './integration-linter'
import { IntegrationDefinition, type IntegrationDefinitionProps, z } from '@botpress/sdk'

const EMPTY_STRING = ''
const TRUTHY_STRING = 'truthy'
const ACTION_NAME = 'actionName'
const EVENT_NAME = 'eventName'
const CONFIG_NAME = 'configName'
const PARAM_NAME = 'paramName'
const TAG_NAME = 'tagName'
const CHANNEL_NAME = 'channelName'
const STATE_NAME = 'stateName'
const MESSAGE_TYPE = 'text'
const SECRET_NAME = 'SECRET_NAME'

const VALID_INTEGRATION = {
  name: TRUTHY_STRING,
  title: TRUTHY_STRING,
  description: TRUTHY_STRING,
  version: TRUTHY_STRING,
  readme: TRUTHY_STRING,
  icon: TRUTHY_STRING,
  actions: {
    [ACTION_NAME]: {
      title: TRUTHY_STRING,
      description: TRUTHY_STRING,
      input: {
        schema: z
          .object({
            [PARAM_NAME]: z.string().title(TRUTHY_STRING).describe(TRUTHY_STRING),
          })
          .title(TRUTHY_STRING)
          .describe(TRUTHY_STRING),
      },
      output: {
        schema: z
          .object({
            [PARAM_NAME]: z.string().title(TRUTHY_STRING).describe(TRUTHY_STRING),
          })
          .title(TRUTHY_STRING)
          .describe(TRUTHY_STRING),
      },
    },
  },
  events: {
    [EVENT_NAME]: {
      title: TRUTHY_STRING,
      description: TRUTHY_STRING,
      schema: z
        .object({
          [PARAM_NAME]: z.string().title(TRUTHY_STRING).describe(TRUTHY_STRING),
        })
        .title(TRUTHY_STRING)
        .describe(TRUTHY_STRING),
    },
  },
  configuration: {
    schema: z
      .object({
        [PARAM_NAME]: z.string().title(TRUTHY_STRING).describe(TRUTHY_STRING),
      })
      .title(TRUTHY_STRING)
      .describe(TRUTHY_STRING),
  },
  configurations: {
    [CONFIG_NAME]: {
      title: TRUTHY_STRING,
      description: TRUTHY_STRING,
      schema: z
        .object({
          [PARAM_NAME]: z.string().title(TRUTHY_STRING).describe(TRUTHY_STRING),
        })
        .title(TRUTHY_STRING)
        .describe(TRUTHY_STRING),
    },
  },
  user: {
    tags: {
      [TAG_NAME]: {
        title: TRUTHY_STRING,
        description: TRUTHY_STRING,
      },
    },
  },
  channels: {
    [CHANNEL_NAME]: {
      title: TRUTHY_STRING,
      description: TRUTHY_STRING,
      messages: {
        [MESSAGE_TYPE]: {
          schema: z
            .object({
              [PARAM_NAME]: z.string().title(TRUTHY_STRING).describe(TRUTHY_STRING),
            })
            .title(TRUTHY_STRING)
            .describe(TRUTHY_STRING),
        },
      },
      message: {
        tags: {
          [TAG_NAME]: {
            title: TRUTHY_STRING,
            description: TRUTHY_STRING,
          },
        },
      },
      conversation: {
        tags: {
          [TAG_NAME]: {
            title: TRUTHY_STRING,
            description: TRUTHY_STRING,
          },
        },
      },
    },
  },
  states: {
    [STATE_NAME]: {
      type: 'integration',
      schema: z
        .object({
          [PARAM_NAME]: z.string().title(TRUTHY_STRING).describe(TRUTHY_STRING),
        })
        .title(TRUTHY_STRING)
        .describe(TRUTHY_STRING),
    },
  },
  secrets: {
    [SECRET_NAME]: {
      description: TRUTHY_STRING,
    },
  },
} as const satisfies IntegrationDefinitionProps

const mockLogger = {
  log: vi.fn((message) => void message),
  warn: vi.fn((message) => void message),
  error: vi.fn((message) => void message),
  debug: vi.fn((message) => void message),
}

const lintDefinition = async (definition: IntegrationDefinitionProps) => {
  const integrationDefinition = new IntegrationDefinition(definition)
  const integrationBody = await prepareCreateIntegrationBody(integrationDefinition)
  const linter = new IntegrationLinter({
    ...integrationBody,
    readme: integrationDefinition.readme,
    icon: integrationDefinition.icon,
    secrets: integrationDefinition.secrets,
  })
  await linter.lint()
  return linter
}

const lintDefinitionAndReturnResults = async (definition: IntegrationDefinitionProps) => {
  const linter = await lintDefinition(definition)
  return linter.getSortedResults()
}

const lintDefinitionAndLogResults = async (definition: IntegrationDefinitionProps) => {
  const linter = await lintDefinition(definition)
  linter.logResults(mockLogger as any)
}

describe.concurrent('Integration Linter', () => {
  test('should lint a valid definition without giving errors', async () => {
    // arrange
    const definition = VALID_INTEGRATION

    // act
    const results = await lintDefinitionAndReturnResults(definition)

    expect(results).toEqual([])
  })

  test('should report an error when missing required fields', async () => {
    // arrange
    const definition = {
      ...VALID_INTEGRATION,
      title: EMPTY_STRING,
    } as const

    // act
    const results = await lintDefinitionAndReturnResults(definition)

    // assert
    expect(results[0]?.message).toContain('title')
  })

  test('should report an error when missing a title in an action input schema', async () => {
    // arrange
    const definition = {
      ...VALID_INTEGRATION,
      actions: {
        [ACTION_NAME]: {
          ...VALID_INTEGRATION.actions[ACTION_NAME],
          input: {
            schema: z.object({
              [PARAM_NAME]: z.string().describe(TRUTHY_STRING),
            }),
          },
        },
      },
    } as const

    // act
    const results = await lintDefinitionAndReturnResults(definition)

    // assert
    expect(results[0]?.message).toContain('title')
  })

  test('should log as an error when severity is 0', async () => {
    // arrange
    const definition = {
      ...VALID_INTEGRATION,
      title: EMPTY_STRING,
    } as const

    // act
    await lintDefinitionAndLogResults(definition)

    // assert
    expect(mockLogger.error).toHaveBeenCalled()
  })

  test('should log as a warning when severity is 1', async () => {
    // arrange
    const definition = {
      ...VALID_INTEGRATION,
      user: {
        tags: {
          [TAG_NAME]: {},
        },
      },
    } as const

    // act
    await lintDefinitionAndLogResults(definition)

    // assert
    expect(mockLogger.warn).toHaveBeenCalled()
  })
})
