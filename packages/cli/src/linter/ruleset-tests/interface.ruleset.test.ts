import { test, expect } from 'vitest'
import { INTERFACE_RULESET } from '../rulesets/interface.ruleset'
import { createDescribeRule, type RecursivePartial } from './common'
import { type CreateInterfaceBody } from '../../api/interface-body'

type PartialInterface = RecursivePartial<CreateInterfaceBody>
const describeRule = createDescribeRule<CreateInterfaceBody>()(INTERFACE_RULESET)

const EMPTY_STRING = ''
const TRUTHY_STRING = 'truthy'
const ACTION_NAME = 'actionName'
const EVENT_NAME = 'eventName'
const PARAM_NAME = 'paramName'
const CHANNEL_NAME = 'channelName'
const STATE_NAME = 'stateName'
const ENTITY_NAME = 'entityName'
const MESSAGE_TYPE = 'text'
const ZUI = 'x-zui'
const LEGACY_ZUI = 'ui'

describeRule('action-inputparams-should-have-a-title', (lint) => {
  test('missing title should trigger', async () => {
    // arrange
    const definition = {
      actions: { [ACTION_NAME]: { input: { schema: { properties: { [PARAM_NAME]: { [ZUI]: {} } } } } } },
    } as const satisfies PartialInterface

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['actions', ACTION_NAME, 'input', 'schema', 'properties', PARAM_NAME, ZUI])
    expect(results[0]?.message).toContain('title')
  })

  test('empty title should trigger', async () => {
    // arrange
    const definition = {
      actions: {
        [ACTION_NAME]: { input: { schema: { properties: { [PARAM_NAME]: { [ZUI]: { title: EMPTY_STRING } } } } } },
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
      PARAM_NAME,
      ZUI,
      'title',
    ])
    expect(results[0]?.message).toContain('title')
  })

  test('valid title should not trigger', async () => {
    // arrange
    const definition = {
      actions: {
        [ACTION_NAME]: { input: { schema: { properties: { [PARAM_NAME]: { [ZUI]: { title: TRUTHY_STRING } } } } } },
      },
    } as const satisfies PartialInterface

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('action-inputparams-must-have-a-description', (lint) => {
  test('missing description should trigger', async () => {
    // arrange
    const definition = {
      actions: { [ACTION_NAME]: { input: { schema: { properties: { [PARAM_NAME]: {} } } } } },
    } as const satisfies PartialInterface

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['actions', ACTION_NAME, 'input', 'schema', 'properties', PARAM_NAME])
    expect(results[0]?.message).toContain('description')
  })

  test('empty description should trigger', async () => {
    // arrange
    const definition = {
      actions: {
        [ACTION_NAME]: { input: { schema: { properties: { [PARAM_NAME]: { description: EMPTY_STRING } } } } },
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
      PARAM_NAME,
      'description',
    ])
    expect(results[0]?.message).toContain('description')
  })

  test('valid description should not trigger', async () => {
    // arrange
    const definition = {
      actions: {
        [ACTION_NAME]: { input: { schema: { properties: { [PARAM_NAME]: { description: TRUTHY_STRING } } } } },
      },
    } as const satisfies PartialInterface

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('action-outputparams-should-have-a-title', (lint) => {
  test('missing title should trigger', async () => {
    // arrange
    const definition = {
      actions: { [ACTION_NAME]: { output: { schema: { properties: { [PARAM_NAME]: { [ZUI]: {} } } } } } },
    } as const satisfies PartialInterface

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['actions', ACTION_NAME, 'output', 'schema', 'properties', PARAM_NAME, ZUI])
    expect(results[0]?.message).toContain('title')
  })

  test('empty title should trigger', async () => {
    // arrange
    const definition = {
      actions: {
        [ACTION_NAME]: { output: { schema: { properties: { [PARAM_NAME]: { [ZUI]: { title: EMPTY_STRING } } } } } },
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
      PARAM_NAME,
      ZUI,
      'title',
    ])
    expect(results[0]?.message).toContain('title')
  })

  test('valid title should not trigger', async () => {
    // arrange
    const definition = {
      actions: {
        [ACTION_NAME]: { output: { schema: { properties: { [PARAM_NAME]: { [ZUI]: { title: TRUTHY_STRING } } } } } },
      },
    } as const satisfies PartialInterface

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('action-outputparams-must-have-a-description', (lint) => {
  test('missing description should trigger', async () => {
    // arrange
    const definition = {
      actions: { [ACTION_NAME]: { output: { schema: { properties: { [PARAM_NAME]: {} } } } } },
    } as const satisfies PartialInterface

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['actions', ACTION_NAME, 'output', 'schema', 'properties', PARAM_NAME])
    expect(results[0]?.message).toContain('description')
  })

  test('empty description should trigger', async () => {
    // arrange
    const definition = {
      actions: {
        [ACTION_NAME]: { output: { schema: { properties: { [PARAM_NAME]: { description: EMPTY_STRING } } } } },
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
      PARAM_NAME,
      'description',
    ])
    expect(results[0]?.message).toContain('description')
  })

  test('valid description should not trigger', async () => {
    // arrange
    const definition = {
      actions: {
        [ACTION_NAME]: { output: { schema: { properties: { [PARAM_NAME]: { description: TRUTHY_STRING } } } } },
      },
    } as const satisfies PartialInterface

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('event-outputparams-should-have-title', (lint) => {
  test('missing title should trigger', async () => {
    // arrange
    const definition = {
      events: { [EVENT_NAME]: { schema: { properties: { [PARAM_NAME]: { [ZUI]: {} } } } } },
    } as const satisfies PartialInterface

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['events', EVENT_NAME, 'schema', 'properties', PARAM_NAME, ZUI])
    expect(results[0]?.message).toContain('title')
  })

  test('empty title should trigger', async () => {
    // arrange
    const definition = {
      events: {
        [EVENT_NAME]: { schema: { properties: { [PARAM_NAME]: { [ZUI]: { title: EMPTY_STRING } } } } },
      },
    } as const satisfies PartialInterface

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['events', EVENT_NAME, 'schema', 'properties', PARAM_NAME, ZUI, 'title'])
    expect(results[0]?.message).toContain('title')
  })

  test('valid title should not trigger', async () => {
    // arrange
    const definition = {
      events: {
        [EVENT_NAME]: { schema: { properties: { [PARAM_NAME]: { [ZUI]: { title: TRUTHY_STRING } } } } },
      },
    } as const satisfies PartialInterface

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('event-outputparams-must-have-description', (lint) => {
  test('missing description should trigger', async () => {
    // arrange
    const definition = {
      events: { [EVENT_NAME]: { schema: { properties: { [PARAM_NAME]: {} } } } },
    } as const satisfies PartialInterface

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['events', EVENT_NAME, 'schema', 'properties', PARAM_NAME])
    expect(results[0]?.message).toContain('description')
  })

  test('empty description should trigger', async () => {
    // arrange
    const definition = {
      events: {
        [EVENT_NAME]: { schema: { properties: { [PARAM_NAME]: { description: EMPTY_STRING } } } },
      },
    } as const satisfies PartialInterface

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['events', EVENT_NAME, 'schema', 'properties', PARAM_NAME, 'description'])
    expect(results[0]?.message).toContain('description')
  })

  test('valid description should not trigger', async () => {
    // arrange
    const definition = {
      events: {
        [EVENT_NAME]: { schema: { properties: { [PARAM_NAME]: { description: TRUTHY_STRING } } } },
      },
    } as const satisfies PartialInterface

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('legacy-zui-title-should-be-removed', (lint) => {
  test('legacy zui title should trigger', async () => {
    // arrange
    const definition = {
      actions: {
        [ACTION_NAME]: { input: { [LEGACY_ZUI]: { [PARAM_NAME]: { title: TRUTHY_STRING } }, schema: {} } },
      },
      events: { [EVENT_NAME]: { [LEGACY_ZUI]: { [PARAM_NAME]: { title: TRUTHY_STRING } }, schema: {} } },
      channels: {
        [CHANNEL_NAME]: {
          messages: { [MESSAGE_TYPE]: { [LEGACY_ZUI]: { [PARAM_NAME]: { title: TRUTHY_STRING } }, schema: {} } },
        },
      },
      entities: { [ENTITY_NAME]: { [LEGACY_ZUI]: { [PARAM_NAME]: { title: TRUTHY_STRING } }, schema: {} } },
    } as const satisfies PartialInterface

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(4)
    expect(results[0]?.message).toContain('.title()')
  })
})

describeRule('legacy-zui-examples-should-be-removed', (lint) => {
  test('legacy zui examples should trigger', async () => {
    // arrange
    const definition = {
      actions: {
        [ACTION_NAME]: { input: { [LEGACY_ZUI]: { [PARAM_NAME]: { examples: [TRUTHY_STRING] } }, schema: {} } },
      },
      events: { [EVENT_NAME]: { [LEGACY_ZUI]: { [PARAM_NAME]: { examples: [TRUTHY_STRING] } }, schema: {} } },
      channels: {
        [CHANNEL_NAME]: {
          messages: { [MESSAGE_TYPE]: { [LEGACY_ZUI]: { [PARAM_NAME]: { examples: [TRUTHY_STRING] } }, schema: {} } },
        },
      },
      entities: { [ENTITY_NAME]: { [LEGACY_ZUI]: { [PARAM_NAME]: { examples: [TRUTHY_STRING] } }, schema: {} } },
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
  test('missing title should trigger', async () => {
    // arrange
    const definition = {
      entities: { [ENTITY_NAME]: { schema: { properties: { [PARAM_NAME]: { [ZUI]: {} } } } } },
    } as const satisfies PartialInterface

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['entities', ENTITY_NAME, 'schema', 'properties', PARAM_NAME, ZUI])
    expect(results[0]?.message).toContain('title')
  })

  test('empty title should trigger', async () => {
    // arrange
    const definition = {
      entities: {
        [ENTITY_NAME]: { schema: { properties: { [PARAM_NAME]: { [ZUI]: { title: EMPTY_STRING } } } } },
      },
    } as const satisfies PartialInterface

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['entities', ENTITY_NAME, 'schema', 'properties', PARAM_NAME, ZUI, 'title'])
    expect(results[0]?.message).toContain('title')
  })

  test('valid title should not trigger', async () => {
    // arrange
    const definition = {
      entities: {
        [ENTITY_NAME]: { schema: { properties: { [PARAM_NAME]: { [ZUI]: { title: TRUTHY_STRING } } } } },
      },
    } as const satisfies PartialInterface

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('entity-fields-must-have-a-description', (lint) => {
  test('missing description should trigger', async () => {
    // arrange
    const definition = {
      entities: { [ENTITY_NAME]: { schema: { properties: { [PARAM_NAME]: {} } } } },
    } as const satisfies PartialInterface

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['entities', ENTITY_NAME, 'schema', 'properties', PARAM_NAME])
    expect(results[0]?.message).toContain('description')
  })

  test('empty description should trigger', async () => {
    // arrange
    const definition = {
      entities: {
        [ENTITY_NAME]: { schema: { properties: { [PARAM_NAME]: { description: EMPTY_STRING } } } },
      },
    } as const satisfies PartialInterface

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['entities', ENTITY_NAME, 'schema', 'properties', PARAM_NAME, 'description'])
    expect(results[0]?.message).toContain('description')
  })

  test('valid description should not trigger', async () => {
    // arrange
    const definition = {
      entities: {
        [ENTITY_NAME]: { schema: { properties: { [PARAM_NAME]: { description: TRUTHY_STRING } } } },
      },
    } as const satisfies PartialInterface

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})
