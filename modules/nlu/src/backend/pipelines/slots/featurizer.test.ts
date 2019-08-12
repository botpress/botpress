import { computeBucket, getFeaturesPairs } from './featureizer'

test('Compute quartile', () => {
  const quartile = computeBucket(4)

  expect(quartile(0, 10)).toEqual(1)
  expect(quartile(1, 10)).toEqual(1)
  expect(quartile(2, 10)).toEqual(1)

  expect(quartile(3, 10)).toEqual(2)
  expect(quartile(4, 10)).toEqual(2)
  expect(quartile(5, 10)).toEqual(2)

  expect(quartile(6, 10)).toEqual(3)
  expect(quartile(7, 10)).toEqual(3)

  expect(quartile(8, 10)).toEqual(4)
  expect(quartile(9, 10)).toEqual(4)
  expect(quartile(10, 10)).toEqual(4)
  expect(quartile(11, 10)).toEqual(4)
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
