import { Document, type ISpectralDiagnostic, Spectral, type RuleDefinition } from '@stoplight/spectral-core'
import { Json as JsonParser } from '@stoplight/spectral-parsers'
import { describe } from 'vitest'

export type RecursivePartial<T> = {
  [P in Extract<keyof T, string>]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object | undefined
      ? RecursivePartial<T[P]>
      : T[P]
}

type Ruleset = {
  rules: Record<string, Readonly<RuleDefinition>>
}

export const createDescribeRule =
  <TDefinition>() =>
  <TRuleset extends Ruleset>(ruleset: TRuleset) =>
  <TPartialDefinition extends RecursivePartial<TDefinition>>(
    ruleName: Extract<keyof (typeof ruleset)['rules'], string>,
    fn: (lint: (definition: TPartialDefinition) => Promise<ISpectralDiagnostic[]>) => void
  ) =>
    describe.concurrent(ruleName, () => {
      const spectral = new Spectral()
      spectral.setRuleset({ ...ruleset, rules: { [ruleName]: ruleset.rules[ruleName]! } })

      const lintFn = (definition: TPartialDefinition) =>
        spectral.run(new Document(JSON.stringify(definition), JsonParser))

      fn(lintFn)
    })
