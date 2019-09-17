import _ from 'lodash'

import { ExtractedEntity, ExtractedSlot, UtteranceClass } from './engine2'
import { SPACE, splitSpaceToken } from './tools/token-utils'

const TOKENS = splitSpaceToken(
  'You might want to behave like if you are not like one of us. But you are!'.replace(/\s/g, SPACE)
)
const VECTORS = TOKENS.map(() => Array.from({ length: 5 }, () => _.random(0, 1, true)))

describe('UtteranceClass', () => {
  describe('tokens', () => {
    test('Array is readonly', () => {
      const utterance = new UtteranceClass(TOKENS, VECTORS)
      expect(() => (utterance.tokens = [])).toThrow()
    })

    test('Token object is readonly', () => {
      const utterance = new UtteranceClass(TOKENS, VECTORS)
      expect(() => (utterance.tokens[0].index = 25)).toThrow()
    })

    test('tokens & vectors are properly associated', () => {
      const utterance = new UtteranceClass(TOKENS, VECTORS)
      utterance.tokens.forEach((tok, i) => {
        expect(tok.index).toEqual(i)
        expect(tok.value).toEqual(TOKENS[i])
        expect(tok.vectors).toEqual(VECTORS[i])
      })
    })

    test('different tokens and vectors length throws', () => {
      expect(() => new UtteranceClass(TOKENS.slice(0, -1), VECTORS)).toThrow()
    })

    test('toString', () => {
      const utterance = new UtteranceClass(TOKENS, VECTORS)

      expect(utterance.tokens[0].toString()).toEqual('You')
      expect(utterance.tokens[0].toString({ lowerCase: true })).toEqual('you')
      expect(utterance.tokens[1].toString()).toEqual(' ')
      expect(utterance.tokens[1].toString({ realSpaces: true })).toEqual(' ')
      expect(utterance.tokens[1].toString({ realSpaces: false })).toEqual(SPACE)
    })

    test('slots', () => {
      const utterance = new UtteranceClass(TOKENS, VECTORS)

      expect(utterance.tokens[0].slots).toEqual([])
      utterance.tagSlot({ name: 'person', confidence: 0.45, source: 'anything' }, 0, 3)

      expect(utterance.tokens[0].slots.length).toEqual(1)
      expect(utterance.tokens[1].slots.length).toEqual(0)
      expect(utterance.tokens[2].slots.length).toEqual(0)
    })

    test('entities', () => {
      const utterance = new UtteranceClass(TOKENS, VECTORS)
      expect(utterance.tokens[0].entities).toEqual([])
      expect(utterance.tokens[3].entities).toEqual([])
      utterance.tagEntity({ type: 'car', confidence: 0.45, value: 'mercedes', metadata: {} }, 5, 10)

      expect(utterance.tokens[0].entities.length).toEqual(0)
      expect(utterance.tokens[1].entities.length).toEqual(0)
      expect(utterance.tokens[2].entities.length).toEqual(0)
      expect(utterance.tokens[3].entities.length).toEqual(1)
    })

    test('tfidf', () => {
      const utterance = new UtteranceClass(TOKENS, VECTORS)

      expect(utterance.tokens[0].tfidf).toEqual(1)
      const tfidf = {
        [TOKENS[0]]: 0.245
      }

      utterance.setGlobalTfidf(tfidf)
      expect(utterance.tokens[0].tfidf).toEqual(0.245)
      expect(utterance.tokens[3].tfidf).toEqual(1)
    })
  })

  describe('slots', () => {
    const slot: ExtractedSlot = {
      name: 'person',
      confidence: 1,
      source: 'a source'
    }

    test('tagSlots out of range', () => {
      const utterance = new UtteranceClass(TOKENS, VECTORS)
      expect(() => utterance.tagSlot(slot, 500, 800)).toThrow()
      expect(utterance.slots).toEqual([])
    })

    test('tagSlots single token', () => {
      const utterance = new UtteranceClass(TOKENS, VECTORS)
      utterance.tagSlot(slot, 0, 3)
      expect(utterance.slots[0].startPos).toEqual(0)
      expect(utterance.slots[0].startTokenIdx).toEqual(0)
      expect(utterance.slots[0].endPos).toEqual(3)
      expect(utterance.slots[0].endTokenIdx).toEqual(0)
    })

    test('tagSlots multiple tokens', () => {
      const utterance = new UtteranceClass(TOKENS, VECTORS)
      utterance.tagSlot(slot, 3, 9)

      expect(utterance.slots[0].startPos).toEqual(3)
      expect(utterance.slots[0].startTokenIdx).toEqual(1)
      expect(utterance.slots[0].endPos).toEqual(9)
      expect(utterance.slots[0].endTokenIdx).toEqual(2)
      expect(utterance.tokens[1].slots.length).toEqual(1)
      expect(utterance.tokens[1].slots[0].name).toEqual(slot.name)
      expect(utterance.tokens[1].slots[0].source).toEqual(slot.source)
      expect(utterance.tokens[1].slots[0].confidence).toEqual(slot.confidence)
      expect(utterance.tokens[2].slots.length).toEqual(1)
      expect(utterance.tokens[2].slots[0].name).toEqual(slot.name)
      expect(utterance.tokens[2].slots[0].source).toEqual(slot.source)
      expect(utterance.tokens[2].slots[0].confidence).toEqual(slot.confidence)
      expect(utterance.tokens[3].slots.length).toEqual(0)
    })
  })

  describe('Entities', () => {
    const entity: ExtractedEntity = {
      type: 'number',
      confidence: 1,
      value: 'one',
      metadata: {
        value: 1
      }
    }

    test('tagEntity out of range', () => {
      const utterance = new UtteranceClass(TOKENS, VECTORS)
      expect(() => utterance.tagEntity(entity, 500, 1300)).toThrow()
    })

    test('tagEntity single token', () => {
      const utterance = new UtteranceClass(TOKENS, VECTORS)
      utterance.tagEntity(entity, 0, 3)
      expect(utterance.entities.length).toEqual(1)
      Object.entries(entity).forEach(([key, value]) => {
        expect(utterance.entities[0][key]).toEqual(value)
      })
      expect(utterance.entities[0].startPos).toEqual(0)
      expect(utterance.entities[0].startTokenIdx).toEqual(0)
      expect(utterance.entities[0].endPos).toEqual(3)
      expect(utterance.entities[0].endTokenIdx).toEqual(0)
    })

    test('tagEntity multiple tokens', () => {
      const utterance = new UtteranceClass(TOKENS, VECTORS)
      utterance.tagEntity(entity, 3, 9)

      expect(utterance.entities[0].startPos).toEqual(3)
      expect(utterance.entities[0].startTokenIdx).toEqual(1)
      expect(utterance.entities[0].endPos).toEqual(9)
      expect(utterance.entities[0].endTokenIdx).toEqual(2)
      expect(utterance.tokens[1].entities.length).toEqual(1)
      Object.entries(entity).forEach(([key, value]) => {
        expect(utterance.tokens[1].entities[0][key]).toEqual(value)
      })
      expect(utterance.tokens[2].entities.length).toEqual(1)
      Object.entries(entity).forEach(([key, value]) => {
        expect(utterance.tokens[2].entities[0][key]).toEqual(value)
      })
      expect(utterance.tokens[3].entities.length).toEqual(0)
    })
  })

  describe('clone', () => {
    const utterance = new UtteranceClass(TOKENS, VECTORS)
    const tfidf = TOKENS.reduce((tfidf, tok) => {
      if (!tfidf[tok]) {
        tfidf[tok] = Math.random()
      }
      return tfidf
    }, {})
    utterance.setGlobalTfidf(tfidf)
    utterance.tagSlot({ name: 'slot', confidence: 1, source: 'hey' }, 2, 15)
    utterance.tagEntity({ type: 'dist', value: 'entity', confidence: 1, metadata: {} }, 22, 28)

    test('clone only', () => {
      const u2 = utterance.clone(false, false)

      expect(u2).not.toBe(utterance)
      expect(u2.slots).toEqual([])
      expect(u2.entities).toEqual([])
      _.zip(utterance.tokens, u2.tokens).forEach(([t1, t2]) => {
        Object.entries(_.omit(t1, 'slots', 'entities', 'toString')).forEach(([k, v]) => expect(v).toEqual(t2[k]))
      })
    })

    test('with entities', () => {
      const u2 = utterance.clone(true, false)

      expect(u2).not.toBe(utterance)
      expect(u2.entities).toEqual(utterance.entities)
      expect(u2.slots).toEqual([])
      _.zip(utterance.tokens, u2.tokens).forEach(([t1, t2]) => {
        Object.entries(_.omit(t1, 'slots', 'toString')).forEach(([k, v]) => expect(v).toEqual(t2[k]))
      })
    })

    test('with slots', () => {
      const u2 = utterance.clone(false, true)

      expect(u2).not.toBe(utterance)
      expect(u2.entities).toEqual([])
      expect(u2.slots).toEqual(utterance.slots)
      _.zip(utterance.tokens, u2.tokens).forEach(([t1, t2]) => {
        Object.entries(_.omit(t1, 'entities', 'toString')).forEach(([k, v]) => expect(v).toEqual(t2[k]))
      })
    })

    test('with entities and slots', () => {
      const u2 = utterance.clone(true, true)

      expect(u2).not.toBe(utterance)
      expect(u2.entities).toEqual(utterance.entities)
      expect(u2.slots).toEqual(utterance.slots)
      _.zip(utterance.tokens, u2.tokens).forEach(([t1, t2]) => {
        Object.entries(_.omit(t1, 'toString')).forEach(([k, v]) => expect(v).toEqual(t2[k]))
      })
    })
  })

  test('toString', () => {
    const str = 'This IS a SUPerTest withFire'
    //           0123456789012345678901234567
    const tokens = splitSpaceToken(str.replace(/\s/g, SPACE))
    const uWithSlots = new UtteranceClass(tokens, tokens.map(t => []))
    const u = new UtteranceClass(tokens, tokens.map(t => []))
    const slot: ExtractedSlot = {
      name: 'Tiger',
      confidence: 1,
      source: 'supertest'
    }
    uWithSlots.tagSlot(slot, 10, 19)

    expect(u.toString({ onlyWords: false, lowerCase: false, slots: 'keep-value' })).toEqual(str)
    expect(u.toString({ onlyWords: false, lowerCase: false, slots: 'keep-slot-name' })).toEqual(str)
    expect(u.toString({ onlyWords: false, lowerCase: true, slots: 'keep-value' })).toEqual(str.toLowerCase())
    expect(uWithSlots.toString({ onlyWords: false, lowerCase: false, slots: 'keep-value' })).toEqual(str)
    expect(uWithSlots.toString({ onlyWords: false, lowerCase: false, slots: 'keep-slot-name' })).toEqual(
      `This IS a ${slot.name} withFire`
    )
    expect(uWithSlots.toString({ onlyWords: true, lowerCase: false, slots: 'keep-slot-name' })).toEqual(
      `ThisISa${slot.name}withFire`
    )
  })
})
