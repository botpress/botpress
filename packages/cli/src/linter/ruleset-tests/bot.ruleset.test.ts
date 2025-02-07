import { test, expect } from 'vitest'
import { BOT_RULESET } from '../rulesets/bot.ruleset'
import { createDescribeRule, type RecursivePartial } from './common'
import { CreateBotRequestBody } from '../../api'

type PartialDefinition = RecursivePartial<CreateBotRequestBody>
const describeRule = createDescribeRule<CreateBotRequestBody>()(BOT_RULESET)

const EMPTY_STRING = ''
const TRUTHY_STRING = 'truthy'
const EVENT_NAME = 'eventName'
const PARAM_NAME = 'paramName'
const PROPERTIES_PARAM = 'properties'
const PARAM_NAMES = [PARAM_NAME, PROPERTIES_PARAM] as const
const TAG_NAME = 'tagName'
const STATE_NAME = 'stateName'
const ZUI = 'x-zui'
const LEGACY_ZUI = 'ui'

describeRule('event-outputparams-should-have-title', (lint) => {
  test.each(PARAM_NAMES)('missing title should trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      events: { [EVENT_NAME]: { schema: { properties: { [paramName]: { [ZUI]: {} } } } } },
    } as const satisfies PartialDefinition

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
    } as const satisfies PartialDefinition

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
    } as const satisfies PartialDefinition

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
    } as const satisfies PartialDefinition

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
    } as const satisfies PartialDefinition

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
    } as const satisfies PartialDefinition

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
    } as const satisfies PartialDefinition

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
    } as const satisfies PartialDefinition

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
    } as const satisfies PartialDefinition

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
    } as const satisfies PartialDefinition

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
    } as const satisfies PartialDefinition

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
    } as const satisfies PartialDefinition

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('user-tags-should-have-a-title', (lint) => {
  test('missing title should trigger', async () => {
    // arrange
    const definition = { user: { tags: { [TAG_NAME]: {} } } } as const satisfies PartialDefinition

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['user', 'tags', TAG_NAME])
    expect(results[0]?.message).toContain('title')
  })

  test('empty title should trigger', async () => {
    // arrange
    const definition = { user: { tags: { [TAG_NAME]: { title: EMPTY_STRING } } } } as const satisfies PartialDefinition

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['user', 'tags', TAG_NAME, 'title'])
    expect(results[0]?.message).toContain('title')
  })

  test('valid title should not trigger', async () => {
    // arrange
    const definition = { user: { tags: { [TAG_NAME]: { title: TRUTHY_STRING } } } } as const satisfies PartialDefinition

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('user-tags-must-have-a-description', (lint) => {
  test('missing description should trigger', async () => {
    // arrange
    const definition = { user: { tags: { [TAG_NAME]: {} } } } as const satisfies PartialDefinition

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
    } as const satisfies PartialDefinition

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
    } as const satisfies PartialDefinition

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('conversation-tags-should-have-a-title', (lint) => {
  test('missing title should trigger', async () => {
    // arrange
    const definition = { conversation: { tags: { [TAG_NAME]: {} } } } as const satisfies PartialDefinition

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['conversation', 'tags', TAG_NAME])
    expect(results[0]?.message).toContain('title')
  })

  test('empty title should trigger', async () => {
    // arrange
    const definition = {
      conversation: { tags: { [TAG_NAME]: { title: EMPTY_STRING } } },
    } as const satisfies PartialDefinition

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['conversation', 'tags', TAG_NAME, 'title'])
    expect(results[0]?.message).toContain('title')
  })

  test('valid title should not trigger', async () => {
    // arrange
    const definition = {
      conversation: { tags: { [TAG_NAME]: { title: TRUTHY_STRING } } },
    } as const satisfies PartialDefinition

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('conversation-tags-must-have-a-description', (lint) => {
  test('missing description should trigger', async () => {
    // arrange
    const definition = { conversation: { tags: { [TAG_NAME]: {} } } } as const satisfies PartialDefinition

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['conversation', 'tags', TAG_NAME])
    expect(results[0]?.message).toContain('description')
  })

  test('empty description should trigger', async () => {
    // arrange
    const definition = {
      conversation: { tags: { [TAG_NAME]: { description: EMPTY_STRING } } },
    } as const satisfies PartialDefinition

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['conversation', 'tags', TAG_NAME, 'description'])
    expect(results[0]?.message).toContain('description')
  })

  test('valid description should not trigger', async () => {
    // arrange
    const definition = {
      conversation: { tags: { [TAG_NAME]: { description: TRUTHY_STRING } } },
    } as const satisfies PartialDefinition

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('message-tags-should-have-a-title', (lint) => {
  test('missing title should trigger', async () => {
    // arrange
    const definition = { message: { tags: { [TAG_NAME]: {} } } } as const satisfies PartialDefinition

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['message', 'tags', TAG_NAME])
    expect(results[0]?.message).toContain('title')
  })

  test('empty title should trigger', async () => {
    // arrange
    const definition = {
      message: { tags: { [TAG_NAME]: { title: EMPTY_STRING } } },
    } as const satisfies PartialDefinition

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['message', 'tags', TAG_NAME, 'title'])
    expect(results[0]?.message).toContain('title')
  })

  test('valid title should not trigger', async () => {
    // arrange
    const definition = {
      message: { tags: { [TAG_NAME]: { title: TRUTHY_STRING } } },
    } as const satisfies PartialDefinition

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('message-tags-must-have-a-description', (lint) => {
  test('missing description should trigger', async () => {
    // arrange
    const definition = { message: { tags: { [TAG_NAME]: {} } } } as const satisfies PartialDefinition

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['message', 'tags', TAG_NAME])
    expect(results[0]?.message).toContain('description')
  })

  test('empty description should trigger', async () => {
    // arrange
    const definition = {
      message: { tags: { [TAG_NAME]: { description: EMPTY_STRING } } },
    } as const satisfies PartialDefinition

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['message', 'tags', TAG_NAME, 'description'])
    expect(results[0]?.message).toContain('description')
  })

  test('valid description should not trigger', async () => {
    // arrange
    const definition = {
      message: { tags: { [TAG_NAME]: { description: TRUTHY_STRING } } },
    } as const satisfies PartialDefinition

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
      configuration: {
        [LEGACY_ZUI]: { [paramName]: { title: TRUTHY_STRING } },
        schema: {},
      },
      events: { [EVENT_NAME]: { [LEGACY_ZUI]: { [paramName]: { title: TRUTHY_STRING } }, schema: {} } },
      states: { [STATE_NAME]: { [LEGACY_ZUI]: { [paramName]: { title: TRUTHY_STRING } }, schema: {} } },
    } as const satisfies PartialDefinition

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(3)
    expect(results[0]?.message).toContain('.title()')
  })
})

describeRule('legacy-zui-examples-should-be-removed', (lint) => {
  test.each(PARAM_NAMES)('legacy zui examples should trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      configuration: {
        [LEGACY_ZUI]: { [paramName]: { examples: [TRUTHY_STRING] } },
        schema: {},
      },
      events: { [EVENT_NAME]: { [LEGACY_ZUI]: { [paramName]: { examples: [TRUTHY_STRING] } }, schema: {} } },
      states: { [STATE_NAME]: { [LEGACY_ZUI]: { [paramName]: { examples: [TRUTHY_STRING] } }, schema: {} } },
    } as const satisfies PartialDefinition

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(3)
    expect(results[0]?.message).toContain('examples')
  })
})

describeRule('state-fields-should-have-title', (lint) => {
  test.each(PARAM_NAMES)('missing title should trigger (%s)', async (paramName) => {
    // arrange
    const definition = {
      states: { [STATE_NAME]: { schema: { properties: { [paramName]: { [ZUI]: {} } } } } },
    } as const satisfies PartialDefinition

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
    } as const satisfies PartialDefinition

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
    } as const satisfies PartialDefinition

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
    } as const satisfies PartialDefinition

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
    } as const satisfies PartialDefinition

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
    } as const satisfies PartialDefinition

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})
