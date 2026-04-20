import { test, expect } from 'vitest'
import { ResolvedIntegrationConfigInstance, IntegrationInstance, BotDefinition } from './definition'
import * as utils from '../utils/type-utils'
import { IntegrationDefinition } from '../integration'
import { PluginDefinition } from '../plugin'
import { z } from '@bpinternal/zui'

test('IntegrationInstance should contain important API fields', async () => {
  type Actual = IntegrationInstance
  type Expected = {
    enabled?: boolean
    configurationType?: string | null
    configuration?: Record<string, any>
  }

  type _assertion = utils.AssertExtends<Actual, Expected>
})

test('IntegrationConfigInstance of integration with no config should be empty', async () => {
  const def = new IntegrationDefinition({
    name: 'frodo',
    version: '1.0.0',
  })
  type Def = typeof def

  type Actual = ResolvedIntegrationConfigInstance<{
    type: 'integration'
    name: Def['name']
    version: Def['version']
    definition: Def
    implementation: null
  }>

  type Expected = {
    enabled?: boolean
    alias: string
    disabledChannels?: string[] | undefined
  } & (
    | {
        configurationType?: null
        configuration: Record<string, any>
      }
    | {
        configurationType: string
        configuration: Record<string, any>
      }
  )

  type _assertion = utils.AssertAll<
    [
      //
      utils.AssertExtends<Actual, Expected>,
      utils.AssertExtends<Expected, Actual>,
      utils.IsEquivalent<Actual, Expected>,
    ]
  >
})

test('IntegrationConfigInstance of integration with single config schema should only allow the single config schema', async () => {
  const def = new IntegrationDefinition({
    name: 'frodo',
    version: '1.0.0',
    configuration: {
      schema: z.object({
        theOneRing: z.string().describe('The One Ring'),
      }),
    },
  })
  type Def = typeof def

  type Actual = ResolvedIntegrationConfigInstance<{
    type: 'integration'
    name: Def['name']
    version: Def['version']
    definition: Def
    implementation: null
  }>

  type Expected = {
    enabled?: boolean
    alias: string
    disabledChannels?: string[] | undefined
  } & (
    | {
        configurationType?: null
        configuration: { theOneRing: string }
      }
    | {
        configurationType: string
        configuration: Record<string, any>
      }
  )

  type _assertion = utils.AssertAll<
    [
      //
      utils.AssertExtends<Actual, Expected>,
      utils.AssertExtends<Expected, Actual>,
      utils.IsEquivalent<Actual, Expected>,
    ]
  >
})

test('IntegrationConfigInstance of integration with multiple config schemas should allow any of the schemas', async () => {
  const def = new IntegrationDefinition({
    name: 'frodo',
    version: '1.0.0',
    configuration: {
      schema: z.object({
        theOneRing: z.string().describe('The One Ring'),
      }),
    },
    configurations: {
      withSword: {
        schema: z.object({
          sting: z.string().describe('Sting; The sword of Frodo'),
        }),
      },
    },
  })
  type Def = typeof def

  type Actual = ResolvedIntegrationConfigInstance<{
    type: 'integration'
    name: Def['name']
    version: Def['version']
    definition: Def
    implementation: null
  }>

  type Expected = {
    enabled?: boolean
    alias: string
    disabledChannels?: string[] | undefined
  } & (
    | {
        configurationType?: null
        configuration: { theOneRing: string }
      }
    | {
        configurationType: 'withSword'
        configuration: { sting: string }
      }
  )

  type _assertion = utils.AssertAll<
    [
      //
      utils.AssertExtends<Actual, Expected>,
      utils.AssertExtends<Expected, Actual>,
      utils.IsEquivalent<Actual, Expected>,
    ]
  >
})

test('IntegrationConfigInstance with field with z.default() is optional in the default config type', async () => {
  const def = new IntegrationDefinition({
    name: 'frodo',
    version: '1.0.0',
    configuration: {
      schema: z.object({
        theOneRing: z.string(),
        isInvisible: z.boolean().default(false),
      }),
    },
  })
  type Def = typeof def
  type Pkg = { type: 'integration'; name: Def['name']; version: Def['version']; definition: Def; implementation: null }

  type ActualConfig = Extract<ResolvedIntegrationConfigInstance<Pkg>, { configurationType?: null }>['configuration']

  // z.input makes defaulted fields optional — you can omit isInvisible when configuring
  type ExpectedConfig = {
    theOneRing: string
    isInvisible?: boolean
  }

  type _assertion = utils.AssertAll<
    [utils.AssertExtends<ActualConfig, ExpectedConfig>, utils.AssertExtends<ExpectedConfig, ActualConfig>]
  >
})

test('IntegrationConfigInstance with field with z.default() is optional in a named config type', async () => {
  const def = new IntegrationDefinition({
    name: 'frodo',
    version: '1.0.0',
    configurations: {
      withSword: {
        schema: z.object({
          sting: z.string(),
          isEnchanted: z.boolean().default(true),
        }),
      },
    },
  })
  type Def = typeof def
  type Pkg = { type: 'integration'; name: Def['name']; version: Def['version']; definition: Def; implementation: null }

  type ActualConfig = Extract<
    ResolvedIntegrationConfigInstance<Pkg>,
    { configurationType: 'withSword' }
  >['configuration']

  // z.input makes defaulted fields optional — you can omit isEnchanted when configuring
  type ExpectedConfig = {
    sting: string
    isEnchanted?: boolean
  }

  type _assertion = utils.AssertAll<
    [utils.AssertExtends<ActualConfig, ExpectedConfig>, utils.AssertExtends<ExpectedConfig, ActualConfig>]
  >
})

test('addIntegration applies schema defaults to the stored default configuration', () => {
  const def = new IntegrationDefinition({
    name: 'frodo',
    version: '1.0.0',
    configuration: {
      schema: z.object({
        theOneRing: z.string(),
        isInvisible: z.boolean().default(false),
      }),
    },
  })

  const pkg = {
    type: 'integration' as const,
    name: def.name,
    version: def.version,
    definition: def,
    implementation: null,
  }
  const botDef = new BotDefinition({}).addIntegration(pkg, {
    configuration: { theOneRing: 'precious' }, // isInvisible intentionally omitted
  })

  const storedConfig = botDef.integrations?.['frodo']?.configuration
  expect(storedConfig).toEqual({ theOneRing: 'precious', isInvisible: false })
})

test('addIntegration applies schema defaults to the stored named configuration', () => {
  const def = new IntegrationDefinition({
    name: 'frodo',
    version: '1.0.0',
    configurations: {
      withSword: {
        schema: z.object({
          sting: z.string(),
          isEnchanted: z.boolean().default(true),
        }),
      },
    },
  })

  const pkg = {
    type: 'integration' as const,
    name: def.name,
    version: def.version,
    definition: def,
    implementation: null,
  }
  const botDef = new BotDefinition({}).addIntegration(pkg, {
    configurationType: 'withSword',
    configuration: { sting: 'elvish blade' }, // isEnchanted intentionally omitted
  })

  const storedConfig = botDef.integrations?.['frodo']?.configuration
  expect(storedConfig).toEqual({ sting: 'elvish blade', isEnchanted: true })
})

test('addPlugin applies schema defaults to the stored configuration', () => {
  const def = new PluginDefinition({
    name: 'samwise',
    version: '1.0.0',
    configuration: {
      schema: z.object({
        lembas: z.number(),
        hasRope: z.boolean().default(true),
      }),
    },
  })

  const pkg = {
    type: 'plugin' as const,
    name: def.name,
    version: def.version,
    definition: def,
    implementation: Buffer.from(''),
  }
  const botDef = new BotDefinition({}).addPlugin(pkg, {
    configuration: { lembas: 3 }, // hasRope intentionally omitted
    dependencies: {},
  })

  const storedConfig = botDef.plugins?.['samwise']?.configuration
  expect(storedConfig).toEqual({ lembas: 3, hasRope: true })
})

test('addPlugin falls back to raw config when schema validation fails', () => {
  const def = new PluginDefinition({
    name: 'gollum',
    version: '1.0.0',
    configuration: {
      schema: z.object({
        preciousEmail: z.string().email(),
        sneaky: z.boolean().default(true),
      }),
    },
  })

  const pkg = {
    type: 'plugin' as const,
    name: def.name,
    version: def.version,
    definition: def,
    implementation: Buffer.from(''),
  }
  // preciousEmail is a placeholder (not a valid email) — safeParse should fail silently
  const botDef = new BotDefinition({}).addPlugin(pkg, {
    configuration: { preciousEmail: '$GOLLUM_EMAIL' },
    dependencies: {},
  })

  const storedConfig = botDef.plugins?.['gollum']?.configuration
  // Falls back to raw config; default for sneaky is not applied since safeParse failed
  expect(storedConfig).toEqual({ preciousEmail: '$GOLLUM_EMAIL' })
})
