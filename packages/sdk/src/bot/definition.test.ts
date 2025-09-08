import { test } from 'vitest'
import { IntegrationConfigInstance, IntegrationInstance } from './definition'
import * as utils from '../utils/type-utils'
import { IntegrationDefinition } from '../integration'
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

  type Actual = IntegrationConfigInstance<{
    type: 'integration'
    name: Def['name']
    version: Def['version']
    definition: Def
    implementation: null
  }>

  type Expected = {
    enabled: boolean
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

  type Actual = IntegrationConfigInstance<{
    type: 'integration'
    name: Def['name']
    version: Def['version']
    definition: Def
    implementation: null
  }>

  type Expected = {
    enabled: boolean
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

  type Actual = IntegrationConfigInstance<{
    type: 'integration'
    name: Def['name']
    version: Def['version']
    definition: Def
    implementation: null
  }>

  type Expected = {
    enabled: boolean
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
