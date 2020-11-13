import _ from 'lodash'

import { TrainOutput } from './training-pipeline'
import { Intent } from './typings'
import { getModifiedContexts, mergeModelOutputs } from './warm-training-handler'

const _makeIntent = (name: string, contexts: string[]): Intent<string> => {
  return {
    contexts,
    name,
    slot_definitions: [],
    utterances: [name]
  }
}

const _makeTrainOuput = (
  intentModels: { ctx: string; model: string }[],
  oosModels: { ctx: string; model: string }[]
): TrainOutput => {
  const contexts = _.uniq([...intentModels.map(i => i.ctx), ...oosModels.map(i => i.ctx)])

  return {
    contexts,
    ctx_model: '',
    exact_match_index: {},
    list_entities: [],
    slots_model: Buffer.from(''),
    tfidf: {},
    vocabVectors: {},
    intent_model_by_ctx: _(intentModels)
      .map(i => [i.ctx, i.model])
      .fromPairs()
      .value(),
    oos_model: _(oosModels)
      .map(i => [i.ctx, i.model])
      .fromPairs()
      .value()
  }
}

describe('getModifiedContexts', () => {
  test('when no change at all, returns empty ds', () => {
    // arrange
    const previousIntents = [_makeIntent('A', ['global']), _makeIntent('B', ['global'])]
    const currentIntents = [_makeIntent('A', ['global']), _makeIntent('B', ['global'])]

    // act
    const changeLog = getModifiedContexts(currentIntents, previousIntents)

    // assert
    expect(changeLog.createdContexts.length).toBe(0)
    expect(changeLog.modifiedContexts.length).toBe(0)
    expect(changeLog.deletedContexts.length).toBe(0)
  })

  test('when no change at all, returns empty ds', () => {
    // arrange
    const previousIntents = [_makeIntent('A', ['global']), _makeIntent('B', ['global'])]
    const currentIntents = [_makeIntent('A', ['global']), _makeIntent('C', ['global'])]

    // act
    const changeLog = getModifiedContexts(currentIntents, previousIntents)

    // assert
    expect(changeLog.createdContexts.length).toBe(0)
    expect(changeLog.modifiedContexts.length).toBe(1)
    expect(changeLog.modifiedContexts[0]).toBe('global')
    expect(changeLog.deletedContexts.length).toBe(0)
  })

  test('when one ctx created, returns one created ctx', () => {
    // arrange
    const previousIntents = [_makeIntent('A', ['global']), _makeIntent('B', ['global'])]
    const currentIntents = [
      _makeIntent('A', ['global']),
      _makeIntent('B', ['global']),
      _makeIntent('C', ['not-global'])
    ]

    // act
    const changeLog = getModifiedContexts(currentIntents, previousIntents)

    // assert
    expect(changeLog.createdContexts.length).toBe(1)
    expect(changeLog.createdContexts[0]).toBe('not-global')
    expect(changeLog.modifiedContexts.length).toBe(0)
    expect(changeLog.deletedContexts.length).toBe(0)
  })

  test('when one ctx deleted, returns one deleted ctx', () => {
    // arrange
    const previousIntents = [
      _makeIntent('A', ['global']),
      _makeIntent('B', ['global']),
      _makeIntent('C', ['not-global'])
    ]
    const currentIntents = [_makeIntent('A', ['global']), _makeIntent('B', ['global'])]

    // act
    const changeLog = getModifiedContexts(currentIntents, previousIntents)

    // assert
    expect(changeLog.createdContexts.length).toBe(0)
    expect(changeLog.modifiedContexts.length).toBe(0)

    expect(changeLog.deletedContexts.length).toBe(1)
    expect(changeLog.deletedContexts[0]).toBe('not-global')
  })

  test('when two ctxs deleted, two created and two change, returns two created, two deleted and two change', () => {
    // arrange
    const previousIntents = [
      _makeIntent('A', ['A1', 'A2']),
      _makeIntent('B', ['B1', 'B2']),
      _makeIntent('C', ['C1', 'C2'])
    ]

    const currentIntents = [
      _makeIntent('A', ['A1', 'A3']),
      _makeIntent('B_hat', ['B1', 'B3']),
      _makeIntent('C_hat', ['C1', 'C2'])
    ]

    // act
    const changeLog = getModifiedContexts(currentIntents, previousIntents)

    // assert
    expect(changeLog.createdContexts.length).toBe(2)
    expect(changeLog.deletedContexts.length).toBe(2)
    expect(changeLog.modifiedContexts.length).toBe(3)

    expect(changeLog.createdContexts.includes('A3')).toBe(true)
    expect(changeLog.createdContexts.includes('B3')).toBe(true)

    expect(changeLog.deletedContexts.includes('A2')).toBe(true)
    expect(changeLog.deletedContexts.includes('B2')).toBe(true)

    expect(changeLog.modifiedContexts.includes('B1')).toBe(true)
    expect(changeLog.modifiedContexts.includes('C1')).toBe(true)
    expect(changeLog.modifiedContexts.includes('C2')).toBe(true)
  })

  test('when context contains more than one intent', () => {
    // arrange
    const previousIntents = [
      _makeIntent('A', ['global', 'A']),
      _makeIntent('B', ['global', 'B']),
      _makeIntent('C', ['global', 'C']),
      _makeIntent('D', ['D1'])
    ]

    const currentIntents = [_makeIntent('C', ['global', 'C']), _makeIntent('D', ['D1', 'D2'])]

    // act
    const changeLog = getModifiedContexts(currentIntents, previousIntents)

    // assert
    expect(changeLog.createdContexts.length).toBe(1)
    expect(changeLog.deletedContexts.length).toBe(2)
    expect(changeLog.modifiedContexts.length).toBe(1)

    expect(changeLog.modifiedContexts[0]).toBe('global')
    expect(changeLog.createdContexts[0]).toBe('D2')

    expect(changeLog.deletedContexts.includes('A')).toBe(true)
    expect(changeLog.deletedContexts.includes('B')).toBe(true)
  })
})

describe('mergeModelsOutputs', () => {
  test('when one context deleted should contain all current contexts', () => {
    // arrange
    const previousTrainOutput = _makeTrainOuput(
      [
        { ctx: 'A', model: 'intent model for A' },
        { ctx: 'B', model: 'intent model for B' }
      ],
      [
        { ctx: 'A', model: 'oos model for A' },
        { ctx: 'B', model: 'oos model for B' }
      ]
    )

    const currentTrainOutput = _makeTrainOuput(
      [{ ctx: 'A', model: 'intent model for A' }],
      [{ ctx: 'A', model: 'oos model for A' }]
    )

    // act
    const output = mergeModelOutputs(currentTrainOutput, previousTrainOutput, ['A'])

    // assert
    expect(output.contexts.length).toBe(1)
    expect(output.contexts[0]).toBe('A')

    expect(output.oos_model['A']).toBe('oos model for A')
    expect(output.intent_model_by_ctx['A']).toBe('intent model for A')
  })

  test('when one context modified should contain the modified context', () => {
    // arrange
    const previousTrainOutput = _makeTrainOuput(
      [
        { ctx: 'A', model: 'intent model for A' },
        { ctx: 'B', model: 'intent model for B' }
      ],
      [
        { ctx: 'A', model: 'oos model for A' },
        { ctx: 'B', model: 'oos model for B' }
      ]
    )

    const currentTrainOutput = _makeTrainOuput(
      [
        { ctx: 'A', model: 'intent model for A' },
        { ctx: 'B', model: 'modified intent model for B' }
      ],
      [
        { ctx: 'A', model: 'oos model for A' },
        { ctx: 'B', model: 'modified oos model for B' }
      ]
    )

    // act
    const output = mergeModelOutputs(currentTrainOutput, previousTrainOutput, ['A', 'B'])

    // assert
    expect(output.contexts.length).toBe(2)
    expect(output.contexts.sort()[0]).toBe('A')
    expect(output.contexts.sort()[1]).toBe('B')

    expect(output.oos_model['A']).toBe('oos model for A')
    expect(output.oos_model['B']).toBe('modified oos model for B')
    expect(output.intent_model_by_ctx['A']).toBe('intent model for A')
    expect(output.intent_model_by_ctx['B']).toBe('modified intent model for B')
  })

  test('when one context created should contain the created context', () => {
    // arrange
    const previousTrainOutput = _makeTrainOuput(
      [{ ctx: 'A', model: 'intent model for A' }],
      [{ ctx: 'A', model: 'oos model for A' }]
    )

    const currentTrainOutput = _makeTrainOuput(
      [
        { ctx: 'A', model: 'intent model for A' },
        { ctx: 'B', model: 'created intent model for B' }
      ],
      [
        { ctx: 'A', model: 'oos model for A' },
        { ctx: 'B', model: 'created oos model for B' }
      ]
    )

    // act
    const output = mergeModelOutputs(currentTrainOutput, previousTrainOutput, ['A', 'B'])

    // assert
    expect(output.contexts.length).toBe(2)
    expect(output.contexts.sort()[0]).toBe('A')
    expect(output.contexts.sort()[1]).toBe('B')

    expect(output.oos_model['A']).toBe('oos model for A')
    expect(output.oos_model['B']).toBe('created oos model for B')
    expect(output.intent_model_by_ctx['A']).toBe('intent model for A')
    expect(output.intent_model_by_ctx['B']).toBe('created intent model for B')
  })

  test('when both one context created and one modified should contain both the created context and the modified one', () => {
    // arrange
    const previousTrainOutput = _makeTrainOuput(
      [
        { ctx: 'A', model: 'intent model for A' },
        { ctx: 'D', model: 'intent model for D' }
      ],
      [
        { ctx: 'A', model: 'oos model for A' },
        { ctx: 'D', model: 'intent model for D' }
      ]
    )

    const currentTrainOutput = _makeTrainOuput(
      [
        { ctx: 'A', model: 'modified intent model for A' },
        { ctx: 'B', model: 'modified intent model for B' },
        { ctx: 'C', model: 'created intent model for C' }
      ],
      [
        { ctx: 'A', model: 'modified oos model for A' },
        { ctx: 'B', model: 'modified oos model for B' },
        { ctx: 'C', model: 'created oos model for C' }
      ]
    )

    // act
    const output = mergeModelOutputs(currentTrainOutput, previousTrainOutput, ['A', 'B', 'C'])

    // assert
    expect(output.contexts.length).toBe(3)
    expect(output.contexts.sort()[0]).toBe('A')
    expect(output.contexts.sort()[1]).toBe('B')
    expect(output.contexts.sort()[2]).toBe('C')

    expect(output.oos_model['A']).toBe('modified oos model for A')
    expect(output.oos_model['B']).toBe('modified oos model for B')
    expect(output.oos_model['C']).toBe('created oos model for C')
    expect(output.intent_model_by_ctx['A']).toBe('modified intent model for A')
    expect(output.intent_model_by_ctx['B']).toBe('modified intent model for B')
    expect(output.intent_model_by_ctx['C']).toBe('created intent model for C')
  })
})
