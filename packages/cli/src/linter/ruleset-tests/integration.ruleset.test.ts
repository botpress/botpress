import { test, expect } from 'vitest'
import { INTEGRATION_RULESET } from '../rulesets/integration.ruleset'
import { type AggregateIntegrationBody } from '../integration-linter'
import { createDescribeRule, type RecursivePartial } from './common'

type PartialIntegration = RecursivePartial<AggregateIntegrationBody>
const describeRule = createDescribeRule<AggregateIntegrationBody>()(INTEGRATION_RULESET)

const EMPTY_STRING = ''
const TRUTHY_STRING = 'truthy'
const ACTION_NAME = 'actionName'
const EVENT_NAME = 'eventName'
const CONFIG_NAME = 'configName'
const PARAM_NAME = 'paramName'
const PROPERTIES_PARAM = 'properties'
const PARAM_NAMES = [PARAM_NAME, PROPERTIES_PARAM] as const
const TAG_NAME = 'tagName'
const CHANNEL_NAME = 'channelName'
const STATE_NAME = 'stateName'
const SECRET_NAME = 'SECRET_NAME'
const MESSAGE_TYPE = 'text'
const ZUI = 'x-zui'
const LEGACY_ZUI = 'ui'

describeRule('integration-title-must-be-present', (lint) => {
  test('missing title should trigger', async () => {
    // arrange
    const definition = {} as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.message).toContain('title')
  })

  test('empty title should trigger', async () => {
    // arrange
    const definition = { title: EMPTY_STRING } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['title'])
  })

  test('valid title should not trigger', async () => {
    // arrange
    const definition = { title: TRUTHY_STRING } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('integration-description-must-be-present', (lint) => {
  test('missing description should trigger', async () => {
    // arrange
    const definition = {} as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.message).toContain('description')
  })

  test('empty description should trigger', async () => {
    // arrange
    const definition = { description: EMPTY_STRING } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['description'])
  })

  test('valid description should not trigger', async () => {
    // arrange
    const definition = { description: TRUTHY_STRING } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('integration-must-have-an-icon', (lint) => {
  test('missing icon should trigger', async () => {
    // arrange
    const definition = {} as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.message).toContain('icon')
  })

  test('empty icon should trigger', async () => {
    // arrange
    const definition = { icon: EMPTY_STRING } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['icon'])
  })

  test('valid icon should not trigger', async () => {
    // arrange
    const definition = { icon: TRUTHY_STRING } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('integration-must-have-a-readme-file', (lint) => {
  test('missing readme should trigger', async () => {
    // arrange
    const definition = {} as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.message).toContain('readme')
  })

  test('empty readme should trigger', async () => {
    // arrange
    const definition = { readme: EMPTY_STRING } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['readme'])
  })

  test('valid readme should not trigger', async () => {
    // arrange
    const definition = { readme: TRUTHY_STRING } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('actions-should-have-a-title', (lint) => {
  test('missing title should trigger', async () => {
    // arrange
    const definition = { actions: { [ACTION_NAME]: {} } } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['actions', ACTION_NAME])
    expect(results[0]?.message).toContain('title')
  })

  test('empty title should trigger', async () => {
    // arrange
    const definition = { actions: { [ACTION_NAME]: { title: EMPTY_STRING } } } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['actions', ACTION_NAME, 'title'])
    expect(results[0]?.message).toContain('title')
  })

  test('valid title should not trigger', async () => {
    // arrange
    const definition = { actions: { [ACTION_NAME]: { title: TRUTHY_STRING } } } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('actions-must-have-a-description', (lint) => {
  test('missing description should trigger', async () => {
    // arrange
    const definition = { actions: { [ACTION_NAME]: {} } } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['actions', ACTION_NAME])
    expect(results[0]?.message).toContain('description')
  })

  test('empty description should trigger', async () => {
    // arrange
    const definition = {
      actions: { [ACTION_NAME]: { description: EMPTY_STRING } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['actions', ACTION_NAME, 'description'])
    expect(results[0]?.message).toContain('description')
  })

  test('valid description should not trigger', async () => {
    // arrange
    const definition = {
      actions: { [ACTION_NAME]: { description: TRUTHY_STRING } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('action-inputparams-should-have-a-title', (lint) => {
  test.each(PARAM_NAMES)('missing title should trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      actions: { [ACTION_NAME]: { input: { schema: { properties: { [paramName]: { [ZUI]: {} } } } } } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['actions', ACTION_NAME, 'input', 'schema', 'properties', paramName, ZUI])
    expect(results[0]?.message).toContain('title')
  })

  test.each(PARAM_NAMES)('empty title should trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      actions: {
        [ACTION_NAME]: { input: { schema: { properties: { [paramName]: { [ZUI]: { title: EMPTY_STRING } } } } } },
      },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['actions', ACTION_NAME, 'input', 'schema', 'properties', paramName, ZUI, 'title'])
    expect(results[0]?.message).toContain('title')
  })

  test.each(PARAM_NAMES)('valid title should not trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      actions: {
        [ACTION_NAME]: { input: { schema: { properties: { [paramName]: { [ZUI]: { title: TRUTHY_STRING } } } } } },
      },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('action-inputparams-must-have-a-description', (lint) => {
  test.each(PARAM_NAMES)('missing description should trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      actions: { [ACTION_NAME]: { input: { schema: { properties: { [paramName]: {} } } } } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['actions', ACTION_NAME, 'input', 'schema', 'properties', paramName])
    expect(results[0]?.message).toContain('description')
  })

  test.each(PARAM_NAMES)('empty description should trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      actions: {
        [ACTION_NAME]: { input: { schema: { properties: { [paramName]: { description: EMPTY_STRING } } } } },
      },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual([
      'actions',
      ACTION_NAME,
      'input',
      'schema',
      'properties',
      paramName,
      'description',
    ])
    expect(results[0]?.message).toContain('description')
  })

  test.each(PARAM_NAMES)('valid description should not trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      actions: {
        [ACTION_NAME]: { input: { schema: { properties: { [paramName]: { description: TRUTHY_STRING } } } } },
      },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('action-outputparams-should-have-a-title', (lint) => {
  test.each(PARAM_NAMES)('missing title should trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      actions: { [ACTION_NAME]: { output: { schema: { properties: { [paramName]: { [ZUI]: {} } } } } } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['actions', ACTION_NAME, 'output', 'schema', 'properties', paramName, ZUI])
    expect(results[0]?.message).toContain('title')
  })

  test.each(PARAM_NAMES)('empty title should trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      actions: {
        [ACTION_NAME]: { output: { schema: { properties: { [paramName]: { [ZUI]: { title: EMPTY_STRING } } } } } },
      },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual([
      'actions',
      ACTION_NAME,
      'output',
      'schema',
      'properties',
      paramName,
      ZUI,
      'title',
    ])
    expect(results[0]?.message).toContain('title')
  })

  test.each(PARAM_NAMES)('valid title should not trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      actions: {
        [ACTION_NAME]: { output: { schema: { properties: { [paramName]: { [ZUI]: { title: TRUTHY_STRING } } } } } },
      },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('action-outputparams-must-have-a-description', (lint) => {
  test.each(PARAM_NAMES)('missing description should trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      actions: { [ACTION_NAME]: { output: { schema: { properties: { [paramName]: {} } } } } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['actions', ACTION_NAME, 'output', 'schema', 'properties', paramName])
    expect(results[0]?.message).toContain('description')
  })

  test.each(PARAM_NAMES)('empty description should trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      actions: {
        [ACTION_NAME]: { output: { schema: { properties: { [paramName]: { description: EMPTY_STRING } } } } },
      },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual([
      'actions',
      ACTION_NAME,
      'output',
      'schema',
      'properties',
      paramName,
      'description',
    ])
    expect(results[0]?.message).toContain('description')
  })

  test.each(PARAM_NAMES)('valid description should not trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      actions: {
        [ACTION_NAME]: { output: { schema: { properties: { [paramName]: { description: TRUTHY_STRING } } } } },
      },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('event-outputparams-should-have-title', (lint) => {
  test.each(PARAM_NAMES)('missing title should trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      events: { [EVENT_NAME]: { schema: { properties: { [paramName]: { [ZUI]: {} } } } } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['events', EVENT_NAME, 'schema', 'properties', paramName, ZUI])
    expect(results[0]?.message).toContain('title')
  })

  test.each(PARAM_NAMES)('empty title should trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      events: {
        [EVENT_NAME]: { schema: { properties: { [paramName]: { [ZUI]: { title: EMPTY_STRING } } } } },
      },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['events', EVENT_NAME, 'schema', 'properties', paramName, ZUI, 'title'])
    expect(results[0]?.message).toContain('title')
  })

  test.each(PARAM_NAMES)('valid title should not trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      events: {
        [EVENT_NAME]: { schema: { properties: { [paramName]: { [ZUI]: { title: TRUTHY_STRING } } } } },
      },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('event-outputparams-must-have-description', (lint) => {
  test.each(PARAM_NAMES)('missing description should trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      events: { [EVENT_NAME]: { schema: { properties: { [paramName]: {} } } } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['events', EVENT_NAME, 'schema', 'properties', paramName])
    expect(results[0]?.message).toContain('description')
  })

  test.each(PARAM_NAMES)('empty description should trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      events: {
        [EVENT_NAME]: { schema: { properties: { [paramName]: { description: EMPTY_STRING } } } },
      },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['events', EVENT_NAME, 'schema', 'properties', paramName, 'description'])
    expect(results[0]?.message).toContain('description')
  })

  test.each(PARAM_NAMES)('valid description should not trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      events: {
        [EVENT_NAME]: { schema: { properties: { [paramName]: { description: TRUTHY_STRING } } } },
      },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('events-must-have-a-title', (lint) => {
  test('missing title should trigger', async () => {
    // arrange
    const definition = { events: { [EVENT_NAME]: {} } } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['events', EVENT_NAME])
    expect(results[0]?.message).toContain('title')
  })

  test('empty title should trigger', async () => {
    // arrange
    const definition = { events: { [EVENT_NAME]: { title: EMPTY_STRING } } } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['events', EVENT_NAME, 'title'])
    expect(results[0]?.message).toContain('title')
  })

  test('valid title should not trigger', async () => {
    // arrange
    const definition = { events: { [EVENT_NAME]: { title: TRUTHY_STRING } } } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('events-must-have-a-description', (lint) => {
  test('missing description should trigger', async () => {
    // arrange
    const definition = { events: { [EVENT_NAME]: {} } } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['events', EVENT_NAME])
    expect(results[0]?.message).toContain('description')
  })

  test('empty description should trigger', async () => {
    // arrange
    const definition = { events: { [EVENT_NAME]: { description: EMPTY_STRING } } } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['events', EVENT_NAME, 'description'])
    expect(results[0]?.message).toContain('description')
  })

  test('valid description should not trigger', async () => {
    // arrange
    const definition = {
      events: { [EVENT_NAME]: { description: TRUTHY_STRING } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('configuration-fields-must-have-a-title', (lint) => {
  test.each(PARAM_NAMES)('missing title should trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      configuration: { schema: { properties: { [paramName]: { [ZUI]: {} } } } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['configuration', 'schema', 'properties', paramName, ZUI])
    expect(results[0]?.message).toContain('title')
  })

  test.each(PARAM_NAMES)('empty title should trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      configuration: { schema: { properties: { [paramName]: { [ZUI]: { title: EMPTY_STRING } } } } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['configuration', 'schema', 'properties', paramName, ZUI, 'title'])
    expect(results[0]?.message).toContain('title')
  })

  test.each(PARAM_NAMES)('valid title should not trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      configuration: { schema: { properties: { [paramName]: { [ZUI]: { title: TRUTHY_STRING } } } } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('configuration-fields-must-have-a-description', (lint) => {
  test.each(PARAM_NAMES)('missing description should trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      configuration: { schema: { properties: { [paramName]: {} } } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['configuration', 'schema', 'properties', paramName])
    expect(results[0]?.message).toContain('description')
  })

  test.each(PARAM_NAMES)('empty description should trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      configuration: { schema: { properties: { [paramName]: { description: EMPTY_STRING } } } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['configuration', 'schema', 'properties', paramName, 'description'])
    expect(results[0]?.message).toContain('description')
  })

  test.each(PARAM_NAMES)('valid description should not trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      configuration: { schema: { properties: { [paramName]: { description: TRUTHY_STRING } } } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('multiple-configurations-must-have-a-title', (lint) => {
  test('missing title should trigger', async () => {
    // arrange
    const definition = {
      configurations: { [CONFIG_NAME]: {} },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['configurations', CONFIG_NAME])
    expect(results[0]?.message).toContain('title')
  })

  test('empty title should trigger', async () => {
    // arrange
    const definition = {
      configurations: { [CONFIG_NAME]: { title: EMPTY_STRING } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['configurations', CONFIG_NAME, 'title'])
    expect(results[0]?.message).toContain('title')
  })

  test('valid title should not trigger', async () => {
    // arrange
    const definition = {
      configurations: { [CONFIG_NAME]: { title: TRUTHY_STRING } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('multiple-configurations-must-have-a-description', (lint) => {
  test('missing description should trigger', async () => {
    // arrange
    const definition = {
      configurations: { [CONFIG_NAME]: {} },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['configurations', CONFIG_NAME])
    expect(results[0]?.message).toContain('description')
  })

  test('empty description should trigger', async () => {
    // arrange
    const definition = {
      configurations: { [CONFIG_NAME]: { description: EMPTY_STRING } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['configurations', CONFIG_NAME, 'description'])
    expect(results[0]?.message).toContain('description')
  })

  test('valid description should not trigger', async () => {
    // arrange
    const definition = {
      configurations: { [CONFIG_NAME]: { description: TRUTHY_STRING } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('multipes-configurations-fields-must-have-a-title', (lint) => {
  test.each(PARAM_NAMES)('missing title should trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      configurations: { [CONFIG_NAME]: { schema: { properties: { [paramName]: { [ZUI]: {} } } } } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['configurations', CONFIG_NAME, 'schema', 'properties', paramName, ZUI])
    expect(results[0]?.message).toContain('title')
  })

  test.each(PARAM_NAMES)('empty title should trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      configurations: {
        [CONFIG_NAME]: { schema: { properties: { [paramName]: { [ZUI]: { title: EMPTY_STRING } } } } },
      },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['configurations', CONFIG_NAME, 'schema', 'properties', paramName, ZUI, 'title'])
    expect(results[0]?.message).toContain('title')
  })

  test.each(PARAM_NAMES)('valid title should not trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      configurations: {
        [CONFIG_NAME]: { schema: { properties: { [paramName]: { [ZUI]: { title: TRUTHY_STRING } } } } },
      },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('multipes-configurations-fields-must-have-a-description', (lint) => {
  test.each(PARAM_NAMES)('missing description should trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      configurations: { [CONFIG_NAME]: { schema: { properties: { [paramName]: {} } } } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['configurations', CONFIG_NAME, 'schema', 'properties', paramName])
    expect(results[0]?.message).toContain('description')
  })

  test.each(PARAM_NAMES)('empty description should trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      configurations: {
        [CONFIG_NAME]: { schema: { properties: { [paramName]: { description: EMPTY_STRING } } } },
      },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['configurations', CONFIG_NAME, 'schema', 'properties', paramName, 'description'])
    expect(results[0]?.message).toContain('description')
  })

  test.each(PARAM_NAMES)('valid description should not trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      configurations: {
        [CONFIG_NAME]: { schema: { properties: { [paramName]: { description: TRUTHY_STRING } } } },
      },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('user-tags-should-have-a-title', (lint) => {
  test('missing title should trigger', async () => {
    // arrange
    const definition = { user: { tags: { [TAG_NAME]: {} } } } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['user', 'tags', TAG_NAME])
    expect(results[0]?.message).toContain('title')
  })

  test('empty title should trigger', async () => {
    // arrange
    const definition = { user: { tags: { [TAG_NAME]: { title: EMPTY_STRING } } } } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['user', 'tags', TAG_NAME, 'title'])
    expect(results[0]?.message).toContain('title')
  })

  test('valid title should not trigger', async () => {
    // arrange
    const definition = {
      user: { tags: { [TAG_NAME]: { title: TRUTHY_STRING } } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('user-tags-must-have-a-description', (lint) => {
  test('missing description should trigger', async () => {
    // arrange
    const definition = { user: { tags: { [TAG_NAME]: {} } } } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['user', 'tags', TAG_NAME])
    expect(results[0]?.message).toContain('description')
  })

  test('empty description should trigger', async () => {
    // arrange
    const definition = {
      user: { tags: { [TAG_NAME]: { description: EMPTY_STRING } } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['user', 'tags', TAG_NAME, 'description'])
    expect(results[0]?.message).toContain('description')
  })

  test('valid description should not trigger', async () => {
    // arrange
    const definition = {
      user: { tags: { [TAG_NAME]: { description: TRUTHY_STRING } } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('channels-should-have-a-title', (lint) => {
  test('missing title should trigger', async () => {
    // arrange
    const definition = { channels: { [CHANNEL_NAME]: {} } } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['channels', CHANNEL_NAME])
    expect(results[0]?.message).toContain('title')
  })

  test('empty title should trigger', async () => {
    // arrange
    const definition = { channels: { [CHANNEL_NAME]: { title: EMPTY_STRING } } } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['channels', CHANNEL_NAME, 'title'])
    expect(results[0]?.message).toContain('title')
  })

  test('valid title should not trigger', async () => {
    // arrange
    const definition = { channels: { [CHANNEL_NAME]: { title: TRUTHY_STRING } } } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('channels-must-have-a-description', (lint) => {
  test('missing description should trigger', async () => {
    // arrange
    const definition = { channels: { [CHANNEL_NAME]: {} } } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['channels', CHANNEL_NAME])
    expect(results[0]?.message).toContain('description')
  })

  test('empty description should trigger', async () => {
    // arrange
    const definition = {
      channels: { [CHANNEL_NAME]: { description: EMPTY_STRING } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['channels', CHANNEL_NAME, 'description'])
    expect(results[0]?.message).toContain('description')
  })

  test('valid description should not trigger', async () => {
    // arrange
    const definition = {
      channels: { [CHANNEL_NAME]: { description: TRUTHY_STRING } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('channels-conversation-tags-should-have-a-title', (lint) => {
  test('missing title should trigger', async () => {
    // arrange
    const definition = {
      channels: { [CHANNEL_NAME]: { conversation: { tags: { [TAG_NAME]: {} } } } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['channels', CHANNEL_NAME, 'conversation', 'tags', TAG_NAME])
    expect(results[0]?.message).toContain('title')
  })

  test('empty title should trigger', async () => {
    // arrange
    const definition = {
      channels: { [CHANNEL_NAME]: { conversation: { tags: { [TAG_NAME]: { title: EMPTY_STRING } } } } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['channels', CHANNEL_NAME, 'conversation', 'tags', TAG_NAME, 'title'])
    expect(results[0]?.message).toContain('title')
  })

  test('valid title should not trigger', async () => {
    // arrange
    const definition = {
      channels: { [CHANNEL_NAME]: { conversation: { tags: { [TAG_NAME]: { title: TRUTHY_STRING } } } } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('channels-conversation-tags-must-have-a-description', (lint) => {
  test('missing description should trigger', async () => {
    // arrange
    const definition = {
      channels: { [CHANNEL_NAME]: { conversation: { tags: { [TAG_NAME]: {} } } } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['channels', CHANNEL_NAME, 'conversation', 'tags', TAG_NAME])
    expect(results[0]?.message).toContain('description')
  })

  test('empty description should trigger', async () => {
    // arrange
    const definition = {
      channels: { [CHANNEL_NAME]: { conversation: { tags: { [TAG_NAME]: { description: EMPTY_STRING } } } } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['channels', CHANNEL_NAME, 'conversation', 'tags', TAG_NAME, 'description'])
    expect(results[0]?.message).toContain('description')
  })

  test('valid description should not trigger', async () => {
    // arrange
    const definition = {
      channels: { [CHANNEL_NAME]: { conversation: { tags: { [TAG_NAME]: { description: TRUTHY_STRING } } } } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('channels-message-tags-should-have-a-title', (lint) => {
  test('missing title should trigger', async () => {
    // arrange
    const definition = {
      channels: { [CHANNEL_NAME]: { message: { tags: { [TAG_NAME]: {} } } } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['channels', CHANNEL_NAME, 'message', 'tags', TAG_NAME])
    expect(results[0]?.message).toContain('title')
  })

  test('empty title should trigger', async () => {
    // arrange
    const definition = {
      channels: { [CHANNEL_NAME]: { message: { tags: { [TAG_NAME]: { title: EMPTY_STRING } } } } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['channels', CHANNEL_NAME, 'message', 'tags', TAG_NAME, 'title'])
    expect(results[0]?.message).toContain('title')
  })

  test('valid title should not trigger', async () => {
    // arrange
    const definition = {
      channels: { [CHANNEL_NAME]: { message: { tags: { [TAG_NAME]: { title: TRUTHY_STRING } } } } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('channels-message-tags-must-have-a-description', (lint) => {
  test('missing description should trigger', async () => {
    // arrange
    const definition = {
      channels: { [CHANNEL_NAME]: { message: { tags: { [TAG_NAME]: {} } } } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['channels', CHANNEL_NAME, 'message', 'tags', TAG_NAME])
    expect(results[0]?.message).toContain('description')
  })

  test('empty description should trigger', async () => {
    // arrange
    const definition = {
      channels: { [CHANNEL_NAME]: { message: { tags: { [TAG_NAME]: { description: EMPTY_STRING } } } } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['channels', CHANNEL_NAME, 'message', 'tags', TAG_NAME, 'description'])
    expect(results[0]?.message).toContain('description')
  })

  test('valid description should not trigger', async () => {
    // arrange
    const definition = {
      channels: { [CHANNEL_NAME]: { message: { tags: { [TAG_NAME]: { description: TRUTHY_STRING } } } } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('legacy-zui-title-should-be-removed', (lint) => {
  test.each(PARAM_NAMES)('legacy zui title should trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      actions: {
        [ACTION_NAME]: { input: { [LEGACY_ZUI]: { [paramName]: { title: TRUTHY_STRING } }, schema: {} } },
      },
      configuration: {
        [LEGACY_ZUI]: { [paramName]: { title: TRUTHY_STRING } },
        schema: {},
      },
      events: { [EVENT_NAME]: { [LEGACY_ZUI]: { [paramName]: { title: TRUTHY_STRING } }, schema: {} } },
      channels: {
        [CHANNEL_NAME]: {
          messages: { [MESSAGE_TYPE]: { [LEGACY_ZUI]: { [paramName]: { title: TRUTHY_STRING } }, schema: {} } },
        },
      },
      states: { [STATE_NAME]: { [LEGACY_ZUI]: { [paramName]: { title: TRUTHY_STRING } }, schema: {} } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(5)
    expect(results[0]?.message).toContain('.title()')
  })
})

describeRule('legacy-zui-examples-should-be-removed', (lint) => {
  test.each(PARAM_NAMES)('legacy zui examples should trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      actions: {
        [ACTION_NAME]: { input: { [LEGACY_ZUI]: { [paramName]: { examples: [TRUTHY_STRING] } }, schema: {} } },
      },
      configuration: {
        [LEGACY_ZUI]: { [paramName]: { examples: [TRUTHY_STRING] } },
        schema: {},
      },
      events: { [EVENT_NAME]: { [LEGACY_ZUI]: { [paramName]: { examples: [TRUTHY_STRING] } }, schema: {} } },
      channels: {
        [CHANNEL_NAME]: {
          messages: { [MESSAGE_TYPE]: { [LEGACY_ZUI]: { [paramName]: { examples: [TRUTHY_STRING] } }, schema: {} } },
        },
      },
      states: { [STATE_NAME]: { [LEGACY_ZUI]: { [paramName]: { examples: [TRUTHY_STRING] } }, schema: {} } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(5)
    expect(results[0]?.message).toContain('examples')
  })
})

describeRule('state-fields-should-have-title', (lint) => {
  test.each(PARAM_NAMES)('missing title should trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      states: { [STATE_NAME]: { schema: { properties: { [paramName]: { [ZUI]: {} } } } } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['states', STATE_NAME, 'schema', 'properties', paramName, ZUI])
  })

  test.each(PARAM_NAMES)('empty title should trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      states: { [STATE_NAME]: { schema: { properties: { [paramName]: { [ZUI]: { title: EMPTY_STRING } } } } } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['states', STATE_NAME, 'schema', 'properties', paramName, ZUI, 'title'])
  })

  test.each(PARAM_NAMES)('valid title should not trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      states: { [STATE_NAME]: { schema: { properties: { [paramName]: { [ZUI]: { title: TRUTHY_STRING } } } } } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('state-fields-must-have-description', (lint) => {
  test.each(PARAM_NAMES)('missing description should trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      states: { [STATE_NAME]: { schema: { properties: { [paramName]: {} } } } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['states', STATE_NAME, 'schema', 'properties', paramName])
  })

  test.each(PARAM_NAMES)('empty description should trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      states: { [STATE_NAME]: { schema: { properties: { [paramName]: { description: EMPTY_STRING } } } } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['states', STATE_NAME, 'schema', 'properties', paramName, 'description'])
  })

  test.each(PARAM_NAMES)('valid description should not trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      states: { [STATE_NAME]: { schema: { properties: { [paramName]: { description: TRUTHY_STRING } } } } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('secrets-must-have-a-description', (lint) => {
  test('missing description should trigger', async () => {
    // arrange
    const definition = { secrets: { [SECRET_NAME]: {} } } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
  })

  test('empty description should trigger', async () => {
    // arrange
    const definition = {
      secrets: { [SECRET_NAME]: { description: EMPTY_STRING } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
  })

  test('valid description should not trigger', async () => {
    // arrange
    const definition = {
      secrets: { [SECRET_NAME]: { description: TRUTHY_STRING } },
    } as const satisfies PartialIntegration

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})
