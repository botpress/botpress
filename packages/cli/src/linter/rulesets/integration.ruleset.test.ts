import { test, expect, describe } from 'vitest'
import { INTEGRATION_RULSESET } from './integration.ruleset'
import { Document, ISpectralDiagnostic, Spectral } from '@stoplight/spectral-core'
import { Json as JsonParser } from '@stoplight/spectral-parsers'
import { CreateIntegrationBody } from 'src/api/integration-body'

type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object | undefined
    ? RecursivePartial<T[P]>
    : T[P]
}
type PartialIntegration = RecursivePartial<CreateIntegrationBody>

const describeRule = (
  ruleName: keyof (typeof INTEGRATION_RULSESET)['rules'],
  fn: (lint: (definition: PartialIntegration) => Promise<ISpectralDiagnostic[]>) => void
) =>
  describe.concurrent(ruleName, () => {
    const spectral = new Spectral()
    spectral.setRuleset({ rules: { [ruleName]: INTEGRATION_RULSESET.rules[ruleName] } })

    const lintFn = (definition: PartialIntegration) =>
      spectral.run(new Document(JSON.stringify(definition), JsonParser))

    fn(lintFn)
  })

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
const ZUI = 'x-zui'
const LEGACY_ZUI = 'ui'

describeRule('integration-title-must-be-present', (lint) => {
  test('missing title should trigger', async () => {
    // arrange
    const definition = {} as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.message).toContain('title')
  })

  test('empty title should trigger', async () => {
    // arrange
    const definition = { title: EMPTY_STRING } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['title'])
  })

  test('valid title should not trigger', async () => {
    // arrange
    const definition = { title: TRUTHY_STRING } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('integration-description-must-be-present', (lint) => {
  test('missing description should trigger', async () => {
    // arrange
    const definition = {} as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.message).toContain('description')
  })

  test('empty description should trigger', async () => {
    // arrange
    const definition = { description: EMPTY_STRING } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['description'])
  })

  test('valid description should not trigger', async () => {
    // arrange
    const definition = { description: TRUTHY_STRING } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('integration-must-have-an-icon', (lint) => {
  test('missing icon should trigger', async () => {
    // arrange
    const definition = {} as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.message).toContain('icon')
  })

  test('empty icon should trigger', async () => {
    // arrange
    const definition = { icon: EMPTY_STRING } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['icon'])
  })

  test('valid icon should not trigger', async () => {
    // arrange
    const definition = { icon: TRUTHY_STRING } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('integration-must-have-a-readme-file', (lint) => {
  test('missing readme should trigger', async () => {
    // arrange
    const definition = {} as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.message).toContain('readme')
  })

  test('empty readme should trigger', async () => {
    // arrange
    const definition = { readme: EMPTY_STRING } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['readme'])
  })

  test('valid readme should not trigger', async () => {
    // arrange
    const definition = { readme: TRUTHY_STRING } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('actions-should-have-a-title', (lint) => {
  test('missing title should trigger', async () => {
    // arrange
    const definition = { actions: { [ACTION_NAME]: {} } } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['actions', ACTION_NAME])
    expect(results[0]?.message).toContain('title')
  })

  test('empty title should trigger', async () => {
    // arrange
    const definition = { actions: { [ACTION_NAME]: { title: EMPTY_STRING } } } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['actions', ACTION_NAME, 'title'])
    expect(results[0]?.message).toContain('title')
  })

  test('valid title should not trigger', async () => {
    // arrange
    const definition = { actions: { [ACTION_NAME]: { title: TRUTHY_STRING } } } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('actions-must-have-a-description', (lint) => {
  test('missing description should trigger', async () => {
    // arrange
    const definition = { actions: { [ACTION_NAME]: {} } } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['actions', ACTION_NAME])
    expect(results[0]?.message).toContain('description')
  })

  test('empty description should trigger', async () => {
    // arrange
    const definition = { actions: { [ACTION_NAME]: { description: EMPTY_STRING } } } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['actions', ACTION_NAME, 'description'])
    expect(results[0]?.message).toContain('description')
  })

  test('valid description should not trigger', async () => {
    // arrange
    const definition = { actions: { [ACTION_NAME]: { description: TRUTHY_STRING } } } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('action-inputparams-should-have-a-title', (lint) => {
  test('missing title should trigger', async () => {
    // arrange
    const definition = {
      actions: { [ACTION_NAME]: { input: { schema: { properties: { [PARAM_NAME]: { [ZUI]: {} } } } } } },
    } as const

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
    } as const

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
    } as const

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
    } as const

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
    } as const

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
    } as const

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
    } as const

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
    } as const

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
    } as const

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
    } as const

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
    } as const

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
    } as const

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
    } as const

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
    } as const

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
    } as const

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
    } as const

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
    } as const

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
    } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('events-must-have-a-title', (lint) => {
  test('missing title should trigger', async () => {
    // arrange
    const definition = { events: { [EVENT_NAME]: {} } } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['events', EVENT_NAME])
    expect(results[0]?.message).toContain('title')
  })

  test('empty title should trigger', async () => {
    // arrange
    const definition = { events: { [EVENT_NAME]: { title: EMPTY_STRING } } } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['events', EVENT_NAME, 'title'])
    expect(results[0]?.message).toContain('title')
  })

  test('valid title should not trigger', async () => {
    // arrange
    const definition = { events: { [EVENT_NAME]: { title: TRUTHY_STRING } } } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('events-must-have-a-description', (lint) => {
  test('missing description should trigger', async () => {
    // arrange
    const definition = { events: { [EVENT_NAME]: {} } } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['events', EVENT_NAME])
    expect(results[0]?.message).toContain('description')
  })

  test('empty description should trigger', async () => {
    // arrange
    const definition = { events: { [EVENT_NAME]: { description: EMPTY_STRING } } } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['events', EVENT_NAME, 'description'])
    expect(results[0]?.message).toContain('description')
  })

  test('valid description should not trigger', async () => {
    // arrange
    const definition = { events: { [EVENT_NAME]: { description: TRUTHY_STRING } } } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('configuration-fields-must-have-a-title', (lint) => {
  test('missing title should trigger', async () => {
    // arrange
    const definition = { configuration: { schema: { properties: { [PARAM_NAME]: { [ZUI]: {} } } } } } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['configuration', 'schema', 'properties', PARAM_NAME, ZUI])
    expect(results[0]?.message).toContain('title')
  })

  test('empty title should trigger', async () => {
    // arrange
    const definition = {
      configuration: { schema: { properties: { [PARAM_NAME]: { [ZUI]: { title: EMPTY_STRING } } } } },
    } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['configuration', 'schema', 'properties', PARAM_NAME, ZUI, 'title'])
    expect(results[0]?.message).toContain('title')
  })

  test('valid title should not trigger', async () => {
    // arrange
    const definition = {
      configuration: { schema: { properties: { [PARAM_NAME]: { [ZUI]: { title: TRUTHY_STRING } } } } },
    } as const

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
    } as const

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
    } as const

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
    } as const

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
    } as const

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
    } as const

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
    } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('multipes-configurations-fields-must-have-a-title', (lint) => {
  test('missing title should trigger', async () => {
    // arrange
    const definition = {
      configurations: { [CONFIG_NAME]: { schema: { properties: { [PARAM_NAME]: { [ZUI]: {} } } } } },
    } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['configurations', CONFIG_NAME, 'schema', 'properties', PARAM_NAME, ZUI])
    expect(results[0]?.message).toContain('title')
  })

  test('empty title should trigger', async () => {
    // arrange
    const definition = {
      configurations: {
        [CONFIG_NAME]: { schema: { properties: { [PARAM_NAME]: { [ZUI]: { title: EMPTY_STRING } } } } },
      },
    } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['configurations', CONFIG_NAME, 'schema', 'properties', PARAM_NAME, ZUI, 'title'])
    expect(results[0]?.message).toContain('title')
  })

  test('valid title should not trigger', async () => {
    // arrange
    const definition = {
      configurations: {
        [CONFIG_NAME]: { schema: { properties: { [PARAM_NAME]: { [ZUI]: { title: TRUTHY_STRING } } } } },
      },
    } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('multipes-configurations-fields-must-have-a-description', (lint) => {
  test('missing description should trigger', async () => {
    // arrange
    const definition = {
      configurations: { [CONFIG_NAME]: { schema: { properties: { [PARAM_NAME]: {} } } } },
    } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['configurations', CONFIG_NAME, 'schema', 'properties', PARAM_NAME])
    expect(results[0]?.message).toContain('description')
  })

  test('empty description should trigger', async () => {
    // arrange
    const definition = {
      configurations: {
        [CONFIG_NAME]: { schema: { properties: { [PARAM_NAME]: { description: EMPTY_STRING } } } },
      },
    } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['configurations', CONFIG_NAME, 'schema', 'properties', PARAM_NAME, 'description'])
    expect(results[0]?.message).toContain('description')
  })

  test('valid description should not trigger', async () => {
    // arrange
    const definition = {
      configurations: {
        [CONFIG_NAME]: { schema: { properties: { [PARAM_NAME]: { description: TRUTHY_STRING } } } },
      },
    } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('user-tags-should-have-a-title', (lint) => {
  test('missing title should trigger', async () => {
    // arrange
    const definition = { user: { tags: { [TAG_NAME]: {} } } } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['user', 'tags', TAG_NAME])
    expect(results[0]?.message).toContain('title')
  })

  test('empty title should trigger', async () => {
    // arrange
    const definition = { user: { tags: { [TAG_NAME]: { title: EMPTY_STRING } } } } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['user', 'tags', TAG_NAME, 'title'])
    expect(results[0]?.message).toContain('title')
  })

  test('valid title should not trigger', async () => {
    // arrange
    const definition = { user: { tags: { [TAG_NAME]: { title: TRUTHY_STRING } } } } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('user-tags-must-have-a-description', (lint) => {
  test('missing description should trigger', async () => {
    // arrange
    const definition = { user: { tags: { [TAG_NAME]: {} } } } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['user', 'tags', TAG_NAME])
    expect(results[0]?.message).toContain('description')
  })

  test('empty description should trigger', async () => {
    // arrange
    const definition = { user: { tags: { [TAG_NAME]: { description: EMPTY_STRING } } } } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['user', 'tags', TAG_NAME, 'description'])
    expect(results[0]?.message).toContain('description')
  })

  test('valid description should not trigger', async () => {
    // arrange
    const definition = { user: { tags: { [TAG_NAME]: { description: TRUTHY_STRING } } } } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('channels-should-have-a-title', (lint) => {
  test('missing title should trigger', async () => {
    // arrange
    const definition = { channels: { [CHANNEL_NAME]: {} } } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['channels', CHANNEL_NAME])
    expect(results[0]?.message).toContain('title')
  })

  test('empty title should trigger', async () => {
    // arrange
    const definition = { channels: { [CHANNEL_NAME]: { title: EMPTY_STRING } } } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['channels', CHANNEL_NAME, 'title'])
    expect(results[0]?.message).toContain('title')
  })

  test('valid title should not trigger', async () => {
    // arrange
    const definition = { channels: { [CHANNEL_NAME]: { title: TRUTHY_STRING } } } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('channels-must-have-a-description', (lint) => {
  test('missing description should trigger', async () => {
    // arrange
    const definition = { channels: { [CHANNEL_NAME]: {} } } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['channels', CHANNEL_NAME])
    expect(results[0]?.message).toContain('description')
  })

  test('empty description should trigger', async () => {
    // arrange
    const definition = { channels: { [CHANNEL_NAME]: { description: EMPTY_STRING } } } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(1)
    expect(results[0]?.path).toEqual(['channels', CHANNEL_NAME, 'description'])
    expect(results[0]?.message).toContain('description')
  })

  test('valid description should not trigger', async () => {
    // arrange
    const definition = { channels: { [CHANNEL_NAME]: { description: TRUTHY_STRING } } } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('channels-conversation-tags-should-have-a-title', (lint) => {
  test('missing title should trigger', async () => {
    // arrange
    const definition = { channels: { [CHANNEL_NAME]: { conversation: { tags: { [TAG_NAME]: {} } } } } } as const

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
    } as const

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
    } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('channels-conversation-tags-must-have-a-description', (lint) => {
  test('missing description should trigger', async () => {
    // arrange
    const definition = { channels: { [CHANNEL_NAME]: { conversation: { tags: { [TAG_NAME]: {} } } } } } as const

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
    } as const

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
    } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('channels-message-tags-should-have-a-title', (lint) => {
  test('missing title should trigger', async () => {
    // arrange
    const definition = { channels: { [CHANNEL_NAME]: { message: { tags: { [TAG_NAME]: {} } } } } } as const

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
    } as const

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
    } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(0)
  })
})

describeRule('channels-message-tags-must-have-a-description', (lint) => {
  test('missing description should trigger', async () => {
    // arrange
    const definition = { channels: { [CHANNEL_NAME]: { message: { tags: { [TAG_NAME]: {} } } } } } as const

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
    } as const

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
    } as const

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
      configuration: {
        [LEGACY_ZUI]: { [PARAM_NAME]: { title: TRUTHY_STRING } },
        schema: {},
      },
      events: { [EVENT_NAME]: { [LEGACY_ZUI]: { [PARAM_NAME]: { title: TRUTHY_STRING } }, schema: {} } },
      channels: {
        [CHANNEL_NAME]: {
          messages: { [MESSAGE_TYPE]: { [LEGACY_ZUI]: { [PARAM_NAME]: { title: TRUTHY_STRING } }, schema: {} } },
        },
      },
      states: { [STATE_NAME]: { [LEGACY_ZUI]: { [PARAM_NAME]: { title: TRUTHY_STRING } }, schema: {} } },
    } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(5)
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
      configuration: {
        [LEGACY_ZUI]: { [PARAM_NAME]: { examples: [TRUTHY_STRING] } },
        schema: {},
      },
      events: { [EVENT_NAME]: { [LEGACY_ZUI]: { [PARAM_NAME]: { examples: [TRUTHY_STRING] } }, schema: {} } },
      channels: {
        [CHANNEL_NAME]: {
          messages: { [MESSAGE_TYPE]: { [LEGACY_ZUI]: { [PARAM_NAME]: { examples: [TRUTHY_STRING] } }, schema: {} } },
        },
      },
      states: { [STATE_NAME]: { [LEGACY_ZUI]: { [PARAM_NAME]: { examples: [TRUTHY_STRING] } }, schema: {} } },
    } as const

    // act
    const results = await lint(definition)

    // assert
    expect(results).toHaveLength(5)
    expect(results[0]?.message).toContain('examples')
  })
})
