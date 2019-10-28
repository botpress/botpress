import _ from 'lodash'

import { SPACE, tokenizeLatinTextForTests } from '../tools/token-utils'

import { ExtractedEntity, ExtractedSlot, Utterance, UtteranceToStringOptions } from './engine2'

const TOKENS = tokenizeLatinTextForTests('You might want to behave like if you are not like one of us. But you are!')
const VECTORS = TOKENS.map(() => Array.from({ length: 5 }, () => _.random(0, 1, true)))

describe('UtteranceClass', () => {
  describe('tokens', () => {
    test('Array is readonly', () => {
      const utterance = new Utterance(TOKENS, VECTORS)
      expect(() => (utterance.tokens = [])).toThrow()
    })

    test('Token object is readonly', () => {
      const utterance = new Utterance(TOKENS, VECTORS)
      expect(() => (utterance.tokens[0].index = 25)).toThrow()
    })

    test('tokens & vectors are properly associated', () => {
      const utterance = new Utterance(TOKENS, VECTORS)
      utterance.tokens.forEach((tok, i) => {
        expect(tok.index).toEqual(i)
        expect(tok.value).toEqual(TOKENS[i])
        expect(tok.vectors).toEqual(VECTORS[i])
      })
    })

    test('different tokens and vectors length throws', () => {
      expect(() => new Utterance(TOKENS.slice(0, -1), VECTORS)).toThrow()
    })

    test('toString', () => {
      const utterance = new Utterance(TOKENS, VECTORS)

      expect(utterance.tokens[0].toString()).toEqual('You')
      expect(utterance.tokens[0].toString({ lowerCase: true })).toEqual('you')
      expect(utterance.tokens[1].toString()).toEqual(' ')
      expect(utterance.tokens[1].toString({ realSpaces: true })).toEqual(' ')
      expect(utterance.tokens[1].toString({ realSpaces: false })).toEqual(SPACE)
    })

    test('slots', () => {
      const utterance = new Utterance(TOKENS, VECTORS)

      expect(utterance.tokens[0].slots).toEqual([])
      utterance.tagSlot({ name: 'person', confidence: 0.45, source: 'anything' }, 0, 3)

      expect(utterance.tokens[0].slots.length).toEqual(1)
      expect(utterance.tokens[1].slots.length).toEqual(0)
      expect(utterance.tokens[2].slots.length).toEqual(0)
    })

    test('entities', () => {
      const utterance = new Utterance(TOKENS, VECTORS)
      expect(utterance.tokens[0].entities).toEqual([])
      expect(utterance.tokens[3].entities).toEqual([])
      utterance.tagEntity({ type: 'car', confidence: 0.45, value: 'mercedes', metadata: {} }, 5, 10)

      expect(utterance.tokens[0].entities.length).toEqual(0)
      expect(utterance.tokens[1].entities.length).toEqual(0)
      expect(utterance.tokens[2].entities.length).toEqual(0)
      expect(utterance.tokens[3].entities.length).toEqual(1)
    })

    test('tfidf', () => {
      const utterance = new Utterance(TOKENS, VECTORS)

      expect(utterance.tokens[0].tfidf).toEqual(1)
      const tfidf = {
        [TOKENS[0]]: 0.245
      }

      utterance.setGlobalTfidf(tfidf)
      expect(utterance.tokens[0].tfidf).toEqual(0.245)
      expect(utterance.tokens[3].tfidf).toEqual(1)
    })

    test('kmeans', () => {
      const utterance = new Utterance(TOKENS, VECTORS)

      expect(utterance.tokens[0].cluster).toEqual(1)
      const mockedKmeans = {
        nearest: jest
          .fn()
          .mockReturnValueOnce([4])
          .mockReturnValue([2])
      }

      utterance.setKmeans(mockedKmeans)
      expect(utterance.tokens[0].cluster).toEqual(4)
      expect(mockedKmeans.nearest.mock.calls[0][0][0]).toEqual(VECTORS[0])
      expect(utterance.tokens[3].cluster).toEqual(2)
      expect(mockedKmeans.nearest.mock.calls[1][0][0]).toEqual(VECTORS[3])
    })
  })

  describe('slots', () => {
    const slot: ExtractedSlot = {
      name: 'person',
      confidence: 1,
      source: 'a source'
    }

    test('tagSlots out of range', () => {
      const utterance = new Utterance(TOKENS, VECTORS)
      expect(() => utterance.tagSlot(slot, 500, 800)).toThrow()
      expect(utterance.slots).toEqual([])
    })

    test('tagSlots single token', () => {
      const utterance = new Utterance(TOKENS, VECTORS)
      utterance.tagSlot(slot, 0, 3)
      expect(utterance.slots[0].startPos).toEqual(0)
      expect(utterance.slots[0].startTokenIdx).toEqual(0)
      expect(utterance.slots[0].endPos).toEqual(3)
      expect(utterance.slots[0].endTokenIdx).toEqual(0)
    })

    test('tagSlots multiple tokens', () => {
      const utterance = new Utterance(TOKENS, VECTORS)
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
      const utterance = new Utterance(TOKENS, VECTORS)
      expect(() => utterance.tagEntity(entity, 500, 1300)).toThrow()
    })

    test('tagEntity single token', () => {
      const utterance = new Utterance(TOKENS, VECTORS)
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
      const utterance = new Utterance(TOKENS, VECTORS)
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
    const utterance = new Utterance(TOKENS, VECTORS)
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

  describe('toString', () => {
    const str = 'This IS a SUPerTest withFire'
    //           0123456789012345678901234567
    const tokens = tokenizeLatinTextForTests(str)
    const fakeVectors = tokens.map(t => [])
    const defaultOptions = {
      entities: 'keep-default',
      slots: 'keep-value',
      onlyWords: false,
      lowerCase: false
    } as UtteranceToStringOptions

    test('format options', () => {
      const u = new Utterance(tokens, fakeVectors)

      expect(u.toString(defaultOptions)).toEqual(str)
      expect(u.toString({ ...defaultOptions, lowerCase: true })).toEqual(str.toLowerCase())
      expect(u.toString({ ...defaultOptions, onlyWords: true })).toEqual(str.replace(/\s/g, ''))
      expect(u.toString({ ...defaultOptions, onlyWords: true, lowerCase: true })).toEqual(
        str.replace(/\s/g, '').toLowerCase()
      )
    })

    test('slot options', () => {
      const u = new Utterance(tokens, fakeVectors)
      const slot: ExtractedSlot = {
        name: 'Tiger',
        confidence: 1,
        source: 'supertest'
      }
      u.tagSlot(slot, 10, 19)

      expect(u.toString(defaultOptions)).toEqual(str)
      expect(u.toString({ ...defaultOptions, slots: 'keep-name' })).toEqual(`This IS a ${slot.name} withFire`)
      expect(u.toString({ ...defaultOptions, slots: 'ignore' })).toEqual(`This IS a  withFire`)
    })

    test('entities options', () => {
      const u = new Utterance(tokens, fakeVectors)
      const entity: ExtractedEntity = {
        type: 'Woods',
        confidence: 1,
        value: '123',
        metadata: {}
      }
      u.tagEntity(entity, 10, 19)

      expect(u.toString(defaultOptions)).toEqual(str)
      expect(u.toString({ ...defaultOptions, entities: 'keep-value' })).toEqual(`This IS a ${entity.value} withFire`)
      expect(u.toString({ ...defaultOptions, entities: 'keep-name' })).toEqual(`This IS a ${entity.type} withFire`)
      expect(u.toString({ ...defaultOptions, entities: 'ignore' })).toEqual(`This IS a  withFire`)
    })

    test('entities and slots options', () => {
      const u = new Utterance(tokens, fakeVectors)
      const slot: ExtractedSlot = {
        name: 'Tiger',
        confidence: 1,
        source: 'supertest'
      }
      u.tagSlot(slot, 10, 19)
      const entity: ExtractedEntity = {
        type: 'Woods',
        confidence: 1,
        value: '123',
        metadata: {}
      }
      u.tagEntity(entity, 10, 19)

      expect(u.toString({ ...defaultOptions, slots: 'keep-value', entities: 'keep-value' })).toEqual(str)
      expect(u.toString({ ...defaultOptions, slots: 'keep-name', entities: 'keep-value' })).toEqual(
        `This IS a ${slot.name} withFire`
      )
      expect(u.toString({ ...defaultOptions, slots: 'ignore', entities: 'keep-default' })).toEqual(str)
      expect(u.toString({ ...defaultOptions, slots: 'ignore', entities: 'keep-value' })).toEqual(
        `This IS a ${entity.value} withFire`
      )
      expect(u.toString({ ...defaultOptions, slots: 'ignore', entities: 'keep-name' })).toEqual(
        `This IS a ${entity.type} withFire`
      )
      expect(u.toString({ ...defaultOptions, slots: 'ignore', entities: 'ignore' })).toEqual(`This IS a  withFire`)
    })
  })
})
