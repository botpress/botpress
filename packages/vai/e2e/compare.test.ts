import { describe } from 'vitest'
import { check } from '../src'
import { compare } from '../src/task/compare'

describe('compare', () => {
  compare('simple check', ['hello', 'howdy!', 'goodbye'] as const, async ({ scenario }) => {
    if (scenario === 'goodbye') {
      check(scenario, 'is a greeting message').toBe(false)
    } else {
      check(scenario, 'is a greeting message').toBe(true)
    }
  })
})
