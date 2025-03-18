import * as sdk from '@botpress/sdk'
import * as errors from '../errors'
import { describe, expect, it } from 'vitest'
import { validateBotDefinition } from './validate-bot'

describe.concurrent('validateBotDefinition', () => {
  it('should throw an error if action names are not in camelCase', async () => {
    const bot = new sdk.BotDefinition({
      actions: {
        'invalid-action': {
          input: { schema: sdk.z.object({}) },
          output: { schema: sdk.z.object({}) },
        },
      },
    })

    expect(() => validateBotDefinition(bot)).toThrowError(errors.BotpressCLIError)
  })

  it('should throw an error if event names are not in camelCase', async () => {
    const bot = new sdk.BotDefinition({
      events: {
        'invalid-event': {
          schema: sdk.z.object({}),
        },
      },
    })

    expect(() => validateBotDefinition(bot)).toThrowError(errors.BotpressCLIError)
  })

  it('should throw an error if state names are not in camelCase', async () => {
    const bot = new sdk.BotDefinition({
      states: {
        'invalid-state': {
          type: 'bot',
          schema: sdk.z.object({}),
        },
      },
    })

    expect(() => validateBotDefinition(bot)).toThrowError(errors.BotpressCLIError)
  })

  it('should allow plugin prefix in action names', async () => {
    const bot = new sdk.BotDefinition({
      actions: {
        'plugin#action': {
          input: { schema: sdk.z.object({}) },
          output: { schema: sdk.z.object({}) },
        },
      },
    })

    expect(() => validateBotDefinition(bot)).not.toThrowError()
  })

  it('should allow plugin prefix in event names', async () => {
    const bot = new sdk.BotDefinition({
      events: {
        'plugin#event': {
          schema: sdk.z.object({}),
        },
      },
    })

    expect(() => validateBotDefinition(bot)).not.toThrowError()
  })

  it('should allow plugin prefix in state names', async () => {
    const bot = new sdk.BotDefinition({
      states: {
        'plugin#state': {
          type: 'bot',
          schema: sdk.z.object({}),
        },
      },
    })

    expect(() => validateBotDefinition(bot)).not.toThrowError()
  })

  it('should throw an error if plugin prefix is not in camelCase', async () => {
    expect(() =>
      validateBotDefinition(
        new sdk.BotDefinition({
          actions: {
            'my-plugin#actionName': {
              input: { schema: sdk.z.object({}) },
              output: { schema: sdk.z.object({}) },
            },
          },
        })
      )
    ).toThrowError(errors.BotpressCLIError)

    expect(() =>
      validateBotDefinition(
        new sdk.BotDefinition({
          events: {
            'my-plugin#eventName': {
              schema: sdk.z.object({}),
            },
          },
        })
      )
    ).toThrowError(errors.BotpressCLIError)

    expect(() =>
      validateBotDefinition(
        new sdk.BotDefinition({
          states: {
            'my-plugin#stateName': {
              type: 'bot',
              schema: sdk.z.object({}),
            },
          },
        })
      )
    ).toThrowError(errors.BotpressCLIError)
  })
})
