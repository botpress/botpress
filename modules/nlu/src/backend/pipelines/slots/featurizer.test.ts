import { computeBucket, getFeaturesPairs } from './featureizer'

test('Compute quartile', () => {
  const res = computeBucket(4, 4, 0.1)
  const res0 = computeBucket(4, 4, 0)
  const res1 = computeBucket(4, 4, 1)
  const res2 = computeBucket(4, 4, 1.1)
  const res3 = computeBucket(4, 4, 2)
  const res4 = computeBucket(4, 4, 2.5)
  const res5 = computeBucket(4, 4, 3)
  const res6 = computeBucket(4, 4, 3.7)
  const res7 = computeBucket(4, 4, 4)

  expect(res).toEqual(1)
  expect(res0).toEqual(1)
  expect(res1).toEqual(1)
  expect(res2).toEqual(2)
  expect(res3).toEqual(2)
  expect(res4).toEqual(3)
  expect(res5).toEqual(3)
  expect(res6).toEqual(4)
  expect(res7).toEqual(4)
})

test('getFeaturesPairs', () => {
  const vec0 = ['w[0]name=1', 'w[0]stop=1', 'w[0]ent=slim', 'w[0]isReal=false', 'w[0]nullfeat=']
  const vec1 = ['w[1]stop=0', 'w[1]name=2', 'w[1]nullfeat=notnull']
  const feats = ['name', 'stop', 'nullfeat']
  const featPairs = getFeaturesPairs(vec0, vec1, feats)

  expect(featPairs.length).toEqual(2)
  expect(featPairs[0]).toEqual('w[0]|w[1]name=1|2')
  expect(featPairs[1]).toEqual('w[0]|w[1]stop=1|0')
})
