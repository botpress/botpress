import { findMostConfidentPredictionMeanStd } from './engine'
import { Prediction } from './typings'

describe('NLU Engine', () => {
  test('findMostConfidentPredictionMeanStd', () => {
    const mapSet = (n: number[]): Prediction[] => n.map((x, i) => <Prediction>{ confidence: x, name: i.toString() })
    const set1 = mapSet([0.8, 0.1, 0.09, 0.08])
    const set2 = mapSet([0.8, 0.7])
    const set3 = mapSet([])
    const set4 = mapSet([0.45, 0.12, 0.11, 0.08, 0.0002])
    const set5 = mapSet([0.2, 0.12, 0.11, 0.08, 0.0002])

    const res1 = findMostConfidentPredictionMeanStd(set1, 0.8, 4)
    const res2 = findMostConfidentPredictionMeanStd(set2, 0.8, 4)
    const res3 = findMostConfidentPredictionMeanStd(set3, 0.8, 4)
    const res4 = findMostConfidentPredictionMeanStd(set4, 0.8, 4)
    const res4b = findMostConfidentPredictionMeanStd(set4, 0.8, 5)
    const res5 = findMostConfidentPredictionMeanStd(set5, 0.8, 4)
    const res5b = findMostConfidentPredictionMeanStd(set5, 0.8, 2)

    expect(res1.name).toBe('0')
    expect(res2.name).toBe('0')
    expect(res3.name).toBe('none')
    expect(res4.name).toBe('0')
    expect(res4b.name).toBe('none')
    expect(res5.name).toBe('none')
    expect(res5b.name).toBe('0')
  })
})
