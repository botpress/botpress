import tfidf, { TfidfInput } from './tfidf'

describe('TFIDF', () => {
  test('accuracy', () => {
    const docs: TfidfInput = {
      A: 'one one one'.split(' '),
      B: 'one one two'.split(' '),
      C: 'one two three'.split(' ')
    }

    const o = tfidf(docs)

    expect(o.A.one).toBeCloseTo(0.5)
    expect(o.A.__avg__).toBeCloseTo(0.5)

    expect(o.B.two).toBeCloseTo(0.5)
    expect(o.B.one).toBeCloseTo(0.5)
    expect(o.B.__avg__).toBeCloseTo(0.5)

    expect(o.C.one).toBeCloseTo(0.5)
    expect(o.C.two).toBeCloseTo(0.5)
    expect(o.C.three).toBeCloseTo(1.098)
    expect(o.C.__avg__).toBeCloseTo(0.699)

    expect(o.__avg__.one).toBeCloseTo(0.5)
    expect(o.__avg__.two).toBeCloseTo(0.5)
    expect(o.__avg__.three).toBeCloseTo(1.098)
  })
})
