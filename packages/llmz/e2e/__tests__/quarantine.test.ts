import { describe, expect, it } from 'vitest'
import { quarantineReason } from './quarantine.js'

describe('production quarantine', () => {
  it('exempts only the three accepted model/scenario pairs', () => {
    const models = ['groq:qwen3.8-27b', 'cerebras:gpt-oss-120b', 'groq:gpt-oss-120b', 'openai:gpt-5.6-luna']
    const scenarios = ['catalog-tomatoes', 'catalog-food', 'catalog-quotes', 'choice-introduction', 'routing']
    const exempted = models.flatMap((model) =>
      scenarios.filter((scenario) => quarantineReason(model, scenario)).map((scenario) => [model, scenario])
    )
    expect(exempted).toEqual([
      ['groq:qwen3.8-27b', 'catalog-tomatoes'],
      ['cerebras:gpt-oss-120b', 'choice-introduction'],
      ['groq:gpt-oss-120b', 'choice-introduction'],
    ])
    expect(quarantineReason('new:model', 'choice-introduction')).toBeUndefined()
  })
})
