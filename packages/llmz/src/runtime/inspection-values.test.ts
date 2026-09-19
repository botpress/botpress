import { describe, expect, it } from 'vitest'

import { truncate } from '../truncate.js'
import { InspectionValues } from './inspection-values.js'

describe('iteration inspection values', () => {
  it('recognizes copied tool values inside inspection data without changing the source', () => {
    const values = new InspectionValues()
    const result = { documents: [{ title: 'Guide', body: 'First line\nSecond line' }] }
    const policy = { maxTokens: 40000, preserve: 'both' as const }
    values.capture(result, policy)

    const inspected = { result: structuredClone(result), selected: result.documents[0]?.title }

    expect(values.prepare(inspected)).toEqual({
      result: truncate({ value: result, ...policy }),
      selected: 'Guide',
    })
    expect(inspected).toEqual({ result, selected: 'Guide' })
    expect(result).toEqual({ documents: [{ title: 'Guide', body: 'First line\nSecond line' }] })
  })

  it('keeps the strictest explicit cap for identical values', () => {
    const values = new InspectionValues()
    const first = { maxTokens: 1000, preserve: 'top' as const }
    const strictest = { maxTokens: 100, preserve: 'bottom' as const }

    for (const value of ['same text', { account: 42 }]) {
      values.capture(value, first)
      values.capture(structuredClone(value), strictest)
      values.capture(structuredClone(value), first)

      expect(values.prepare(value)).toEqual(truncate({ value, ...strictest }))
    }
  })

  it('retains explicit zero-token policies for primitive results', () => {
    const values = new InspectionValues()
    const policy = { maxTokens: 0, preserve: 'top' as const }

    for (const value of [42, true, false, null, undefined]) {
      values.capture(value, policy)
      values.capture(value, { maxTokens: 100, preserve: 'bottom' })

      expect(values.prepare(value)).toEqual(truncate({ value, ...policy }))
    }
  })

  it('resolves equal-cap preservation conflicts independently of completion order', () => {
    const bottom = { maxTokens: 100, preserve: 'bottom' as const }
    const both = { maxTokens: 100, preserve: 'both' as const }

    for (const policies of [
      [bottom, both],
      [both, bottom],
    ]) {
      const values = new InspectionValues()

      for (const policy of policies) {
        values.capture('same text', policy)
      }

      expect(values.prepare('same text')).toEqual(truncate({ value: 'same text', maxTokens: 100, preserve: 'top' }))
    }
  })

  it('does not turn unsupported display metadata into a failed business call', () => {
    const values = new InspectionValues()
    const policy = { maxTokens: 100, preserve: 'top' as const }
    const cyclic: Record<string, unknown> = {}
    cyclic.self = cyclic

    expect(() => values.capture(new Date(), policy)).not.toThrow()
    expect(() => values.capture(cyclic, policy)).not.toThrow()
    expect(() => values.capture(() => 42, policy)).not.toThrow()
    expect(values.prepare('unrelated result')).toBe('unrelated result')
  })

  it('does not apply the policy to modified values or a later iteration', () => {
    const values = new InspectionValues()
    const result = { records: ['original'] }
    const policy = { maxTokens: 20, preserve: 'top' as const }
    values.capture(result, policy)
    values.capture('original text', policy)
    result.records.push('added')

    expect(values.prepare(result)).toEqual({ records: ['original', 'added'] })
    expect(values.prepare('original text with added details')).toBe('original text with added details')
    expect(values.prepare({ records: ['original'] })).toEqual(truncate({ value: { records: ['original'] }, ...policy }))
    expect(new InspectionValues().prepare({ records: ['original'] })).toEqual({ records: ['original'] })
  })

  it('preserves independent policies for nested values', () => {
    const values = new InspectionValues()
    const text = 'A complete document'
    const parent = { body: text }
    const parentPolicy = { maxTokens: 1000, preserve: 'top' as const }
    const textPolicy = { maxTokens: 20, preserve: 'both' as const }
    values.capture(parent, parentPolicy)
    values.capture(text, textPolicy)

    expect(values.prepare(parent)).toEqual(
      truncate({
        value: { body: truncate({ value: text, ...textPolicy }) },
        ...parentPolicy,
      })
    )
  })

  it('retains ordinary tool limits alongside explicit policies in combined inspections', () => {
    const values = new InspectionValues()
    const rag = { documents: [{ body: 'Retrieved document text' }] }
    const ordinary = 'Ordinary tool response'
    values.capture(rag, { maxTokens: 40000, preserve: 'both' })
    values.captureDefault(rag, 64)
    values.captureDefault(ordinary, 64)

    expect(values.prepare({ results: [rag, ordinary] })).toEqual({
      results: [
        truncate({ value: rag, maxTokens: 40000, preserve: 'both' }),
        truncate({ value: ordinary, maxTokens: 64 }),
      ],
    })
  })

  it('lets explicit policies override defaults independently of capture order', () => {
    const policy = { maxTokens: 1000, preserve: 'bottom' as const }

    for (const explicitFirst of [false, true]) {
      for (const value of ['same text', { body: 'same text' }]) {
        const values = new InspectionValues()

        if (explicitFirst) {
          values.capture(value, policy)
        }

        values.captureDefault(value, 1)

        if (!explicitFirst) {
          values.capture(value, policy)
        }

        expect(values.prepare(value)).toEqual(truncate({ value, ...policy }))
      }
    }
  })
})
