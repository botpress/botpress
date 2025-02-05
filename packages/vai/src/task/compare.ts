import { z } from '@bpinternal/zui'

import { TestFunction } from 'vitest'
import { createTaskCollector, getCurrentSuite } from 'vitest/suite'
import { TestMetadata } from '../context'
import { Deferred } from '../utils/deferred'

const scenarioId = z
  .string()
  .trim()
  .min(1, 'Scenario ID/name must not be empty')
  .max(50, 'Scenario ID/name is too long')

export type ScenarioLike = z.infer<typeof ScenarioLike>
const ScenarioLike = z.union([
  scenarioId,
  z.object({ name: scenarioId }).passthrough(),
  z.object({ id: scenarioId }).passthrough(),
])

const getScenarioName = (scenario: ScenarioLike) =>
  (typeof scenario === 'string' ? scenario : 'name' in scenario ? scenario?.name : scenario?.id) as string

const scenarioArgs = z
  .array(ScenarioLike)
  .min(2, 'You need at least two scenarios to compare')
  .max(10, 'You can only compare up to 10 scenarios')
  .refine((scenarios) => {
    const set = new Set<string>()
    scenarios.forEach((scenario) => set.add(getScenarioName(scenario)))
    return set.size === scenarios.length
  }, 'Scenarios names must be unique')

export function compare<T extends ReadonlyArray<ScenarioLike>>(
  name: string | Function,
  scenarios: T,
  fn?: TestFunction<{
    scenario: T[number]
  }>
) {
  scenarios = scenarioArgs.parse(scenarios) as unknown as T

  return createTaskCollector((_name, fn, timeout) => {
    const currentSuite = getCurrentSuite()

    let completedCount = 0
    const finished = new Deferred<void>()

    for (const scenario of scenarios) {
      const key = getScenarioName(scenario)

      currentSuite.task(key, {
        meta: {
          scenario: key,
          isVaiTest: true,
        } satisfies TestMetadata,
        handler: async (context) => {
          const extendedContext = Object.freeze({
            scenario,
          })
          context.onTestFinished(() => {
            if (++completedCount === scenarios.length) {
              finished.resolve()
            }
          })

          await fn({ ...context, ...extendedContext })
        },
        timeout: timeout ?? 10_000,
      })
    }
  })(name, fn)
}
