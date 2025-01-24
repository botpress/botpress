import { beforeEach, describe, expect, test } from 'vitest'
import { getBestModels, getFastModels, Model, ModelPreferences, pickModel, RemoteModelProvider } from '../src/models'

import MODELS from './models.json'
import { writeFileSync } from 'node:fs'
import { getTestClient } from './client'

describe('Models', () => {
  test.skip('should fetch models', async () => {
    // Run me manually if you need to re-generate the models.json file
    // Make sure to setup the environment variables
    const provider = new RemoteModelProvider(getTestClient())
    const models = await provider.fetchInstalledModels()
    writeFileSync('./models.json', JSON.stringify(models, null, 2))
  })

  test('Models ranking (best)', () => {
    const best = getBestModels(MODELS as Model[])
    expect(best.slice(0, 10).map((x) => x.ref)).toEqual([
      'openai:gpt-4o-2024-11-20',
      'openai:gpt-4o-2024-08-06',
      'google-ai:models/gemini-1.5-pro-002',
      'anthropic:claude-3-5-sonnet-20240620',
      'openai:gpt-4o-mini-2024-07-18',
      'groq:llama-3.2-90b-vision-preview',
      'groq:llama-3.3-70b-versatile',
      'fireworks-ai:accounts/fireworks/models/llama-v3p1-405b-instruct',
      'google-ai:models/gemini-1.5-flash-002',
      'openai:o1-mini-2024-09-12',
    ])
  })

  test('Models ranking (fast)', () => {
    const fast = getFastModels(MODELS as Model[])
    expect(fast.slice(0, 10).map((x) => x.ref)).toEqual([
      'openai:gpt-4o-mini-2024-07-18',
      'google-ai:models/gemini-1.5-flash-002',
      'google-ai:models/gemini-1.5-flash-8b-001',
      'openai:gpt-4o-2024-11-20',
      'openai:gpt-4o-2024-08-06',
      'google-ai:models/gemini-1.5-pro-002',
      'anthropic:claude-3-haiku-20240307',
      'anthropic:claude-3-5-sonnet-20240620',
      'groq:llama-3.2-90b-vision-preview',
      'groq:llama-3.3-70b-versatile',
    ])
  })

  test('Models ranking (boosted)', () => {
    const fast = getFastModels(MODELS as Model[], {
      'groq:llama-3.3-70b-versatile': 10,
      'openai:gpt-4o-mini-2024-07-18': -10,
      'google-ai:': 20,
    })
    expect(fast.slice(0, 10).map((x) => x.ref)).toEqual([
      'google-ai:models/gemini-1.5-flash-002',
      'google-ai:models/gemini-1.5-flash-8b-001',
      'google-ai:models/gemini-1.5-pro-002',
      'groq:llama-3.3-70b-versatile',
      'openai:gpt-4o-2024-11-20',
      'openai:gpt-4o-2024-08-06',
      'anthropic:claude-3-haiku-20240307',
      'anthropic:claude-3-5-sonnet-20240620',
      'groq:llama-3.2-90b-vision-preview',
      'fireworks-ai:accounts/fireworks/models/llama-v3p1-405b-instruct',
    ])
  })

  test('Pick model throws if none provided', () => {
    expect(() => pickModel([])).toThrow()
    expect(() => pickModel([], [])).toThrow()
  })

  test('Pick model throws if all models down', () => {
    expect(() =>
      pickModel(
        ['a:b', 'b:c'],
        [
          { ref: 'a:b', reason: 'down', startedAt: new Date().toISOString() },
          { ref: 'b:c', reason: 'down', startedAt: new Date().toISOString() },
        ]
      )
    ).toThrow()
  })

  test('Pick model picks the first one if all are up', () => {
    expect(pickModel(['a:b', 'b:c'])).toEqual('a:b')
  })

  test('Pick model picks fallback when first down', () => {
    expect(pickModel(['a:b', 'b:c'], [{ ref: 'a:b', reason: 'down', startedAt: new Date().toISOString() }])).toEqual(
      'b:c'
    )
  })
})

describe('Remote Model Provider', () => {
  beforeEach(async () => {
    const client = getTestClient()
    const provider = new RemoteModelProvider(client)
    await provider.deleteModelPreferences()
  })

  test('fetch models preferences', async () => {
    const client = getTestClient()
    const provider = new RemoteModelProvider(client)
    const preferences = await provider.fetchModelPreferences()
    expect(preferences).toEqual(null)
  })

  test('save file preferences', async () => {
    const client = getTestClient()
    const provider = new RemoteModelProvider(client)

    const customPreferences = {
      best: ['openai:gpt-4o-2024-11-20' as const],
      fast: ['openai:gpt-4o-mini-2024-07-18' as const],
      downtimes: [],
    } satisfies ModelPreferences

    await provider.saveModelPreferences(customPreferences)

    const preferences = await provider.fetchModelPreferences()

    expect(preferences).toEqual({
      best: ['openai:gpt-4o-2024-11-20'],
      downtimes: [],
      fast: ['openai:gpt-4o-mini-2024-07-18'],
    })
  })
})
