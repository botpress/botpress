import { test, expect } from 'vitest'
import { INTERFACE_RULESET } from '../rulesets/interface.ruleset'
import { createDescribeRule, type RecursivePartial } from './common'
import { CreateInterfaceRequestBody } from '../../api'

type PartialInterface = RecursivePartial<CreateInterfaceRequestBody>
const describeRule = createDescribeRule<CreateInterfaceRequestBody>()(INTERFACE_RULESET)

const EMPTY_STRING = ''
const TRUTHY_STRING = 'truthy'
const ACTION_NAME = 'actionName'
const EVENT_NAME = 'eventName'
const PARAM_NAME = 'paramName'
const PROPERTIES_PARAM = 'properties'
const PARAM_NAMES = [PARAM_NAME, PROPERTIES_PARAM] as const
const CHANNEL_NAME = 'channelName'
const ENTITY_NAME = 'entityName'
const MESSAGE_TYPE = 'text'
const ZUI = 'x-zui'
const LEGACY_ZUI = 'ui'

describeRule('action-inputparams-should-have-a-title', (lint) => {
  test.each(PARAM_NAMES)('missing title should trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      actions: { [ACTION_NAME]: { input: { schema: { properties: { [paramName]: { [ZUI]: {} } } } } } },
    } as const satisfies PartialInterface

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
    } as const satisfies PartialInterface

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
    } as const satisfies PartialInterface

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
    } as const satisfies PartialInterface

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
    } as const satisfies PartialInterface

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
    } as const satisfies PartialInterface

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
    } as const satisfies PartialInterface

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
    } as const satisfies PartialInterface

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
    } as const satisfies PartialInterface

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
    } as const satisfies PartialInterface

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
    } as const satisfies PartialInterface

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
    } as const satisfies PartialInterface

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
    } as const satisfies PartialInterface

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
    } as const satisfies PartialInterface

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
    } as const satisfies PartialInterface

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
    } as const satisfies PartialInterface

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
    } as const satisfies PartialInterface

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
    } as const satisfies PartialInterface

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
      events: { [EVENT_NAME]: { [LEGACY_ZUI]: { [paramName]: { title: TRUTHY_STRING } }, schema: {} } },
      channels: {
        [CHANNEL_NAME]: {
          messages: { [MESSAGE_TYPE]: { [LEGACY_ZUI]: { [paramName]: { title: TRUTHY_STRING } }, schema: {} } },
        },
      },
      entities: { [ENTITY_NAME]: { [LEGACY_ZUI]: { [paramName]: { title: TRUTHY_STRING } }, schema: {} } },
    } as const satisfies PartialInterface

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(4)
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
      events: { [EVENT_NAME]: { [LEGACY_ZUI]: { [paramName]: { examples: [TRUTHY_STRING] } }, schema: {} } },
      channels: {
        [CHANNEL_NAME]: {
          messages: { [MESSAGE_TYPE]: { [LEGACY_ZUI]: { [paramName]: { examples: [TRUTHY_STRING] } }, schema: {} } },
        },
      },
      entities: { [ENTITY_NAME]: { [LEGACY_ZUI]: { [paramName]: { examples: [TRUTHY_STRING] } }, schema: {} } },
    } as const satisfies PartialInterface

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(4)
    expect(results[0]?.message).toContain('examples')
  })
})

describeRule('entities-should-have-a-title', (lint) => {
  test('missing title should trigger', async () => {
    // arrange
    const definition = {
      entities: { [ENTITY_NAME]: {} },
    } as const satisfies PartialInterface

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['entities', ENTITY_NAME])
    expect(results[0]?.message).toContain('title')
  })

  test('empty title should trigger', async () => {
    // arrange
    const definition = {
      entities: { [ENTITY_NAME]: { title: EMPTY_STRING } },
    } as const satisfies PartialInterface

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['entities', ENTITY_NAME, 'title'])
    expect(results[0]?.message).toContain('title')
  })

  test('valid title should not trigger', async () => {
    // arrange
    const definition = {
      entities: { [ENTITY_NAME]: { title: TRUTHY_STRING } },
    } as const satisfies PartialInterface

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('entities-must-have-a-description', (lint) => {
  test('missing description should trigger', async () => {
    // arrange
    const definition = {
      entities: { [ENTITY_NAME]: {} },
    } as const satisfies PartialInterface

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['entities', ENTITY_NAME])
    expect(results[0]?.message).toContain('description')
  })

  test('empty description should trigger', async () => {
    // arrange
    const definition = {
      entities: { [ENTITY_NAME]: { description: EMPTY_STRING } },
    } as const satisfies PartialInterface

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['entities', ENTITY_NAME, 'description'])
    expect(results[0]?.message).toContain('description')
  })

  test('valid description should not trigger', async () => {
    // arrange
    const definition = {
      entities: { [ENTITY_NAME]: { description: TRUTHY_STRING } },
    } as const satisfies PartialInterface

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('entity-fields-should-have-a-title', (lint) => {
  test.each(PARAM_NAMES)('missing title should trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      entities: { [ENTITY_NAME]: { schema: { properties: { [paramName]: { [ZUI]: {} } } } } },
    } as const satisfies PartialInterface

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['entities', ENTITY_NAME, 'schema', 'properties', paramName, ZUI])
    expect(results[0]?.message).toContain('title')
  })

  test.each(PARAM_NAMES)('empty title should trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      entities: {
        [ENTITY_NAME]: { schema: { properties: { [paramName]: { [ZUI]: { title: EMPTY_STRING } } } } },
      },
    } as const satisfies PartialInterface

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['entities', ENTITY_NAME, 'schema', 'properties', paramName, ZUI, 'title'])
    expect(results[0]?.message).toContain('title')
  })

  test.each(PARAM_NAMES)('valid title should not trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      entities: {
        [ENTITY_NAME]: { schema: { properties: { [paramName]: { [ZUI]: { title: TRUTHY_STRING } } } } },
      },
    } as const satisfies PartialInterface

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('entity-fields-must-have-a-description', (lint) => {
  test.each(PARAM_NAMES)('missing description should trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      entities: { [ENTITY_NAME]: { schema: { properties: { [paramName]: {} } } } },
    } as const satisfies PartialInterface

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['entities', ENTITY_NAME, 'schema', 'properties', paramName])
    expect(results[0]?.message).toContain('description')
  })

  test.each(PARAM_NAMES)('empty description should trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      entities: {
        [ENTITY_NAME]: { schema: { properties: { [paramName]: { description: EMPTY_STRING } } } },
      },
    } as const satisfies PartialInterface

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['entities', ENTITY_NAME, 'schema', 'properties', paramName, 'description'])
    expect(results[0]?.message).toContain('description')
  })

  test.each(PARAM_NAMES)('valid description should not trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      entities: {
        [ENTITY_NAME]: { schema: { properties: { [paramName]: { description: TRUTHY_STRING } } } },
      },
    } as const satisfies PartialInterface

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})
