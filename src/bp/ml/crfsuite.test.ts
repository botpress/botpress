import { Tagger, Trainer } from './crfsuite'

describe('crfsuite', () => {
  it('loads properly', () => {
    expect(Tagger).toBeDefined()
    expect(Trainer).toBeDefined()
  })
})
