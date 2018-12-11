import { generateTrainingSequence, tokenize } from './tagger'

const AN_ENTITY = 'person'

describe('Tagger', () => {
  test('generate training seq', () => {
    const slotDef = [
      {
        name: 'ME',
        entity: AN_ENTITY
      },
      {
        name: 'YOU',
        entity: AN_ENTITY
      }
    ]

    const trainingSeq = generateTrainingSequence(`hello my name is [Jacob Jacobson](${slotDef[0].name}) and your name is [Paul](${slotDef[1].name})`, slotDef)

    expect(trainingSeq.cannonical).toEqual('hello my name is Jacob Jacobson and your name is Paul')
    expect(trainingSeq.tokens.filter(t => t.tag != 'o').length).toEqual(3)
    expect(trainingSeq.tokens[0].slot).toBeUndefined()
    expect(trainingSeq.tokens[0].matchedEntity).toBeUndefined()
    expect(trainingSeq.tokens[0].tag).toEqual('o')
    expect(trainingSeq.tokens[0].value).toEqual('hello')
    expect(trainingSeq.tokens[4].slot).toEqual(slotDef[0].name)
    expect(trainingSeq.tokens[4].matchedEntity).toEqual(slotDef[0].entity)
    expect(trainingSeq.tokens[4].tag).toEqual('B')
    expect(trainingSeq.tokens[4].value).toEqual('Jacob')
    expect(trainingSeq.tokens[5].slot).toEqual(slotDef[0].name)
    expect(trainingSeq.tokens[5].matchedEntity).toEqual(slotDef[0].entity)
    expect(trainingSeq.tokens[5].tag).toEqual('I')
    expect(trainingSeq.tokens[5].value).toEqual('Jacobson')
  })
})
