import { checkRule, resourceMatches } from '../../common/auth'

import { enrichResources } from './resources'

test('resourceMatches', () => {
  expect(resourceMatches('', '')).toBe(true)
  expect(resourceMatches('*', 'everything.will.match')).toBe(true)
  expect(resourceMatches('everything.*', 'everything.will.match')).toBe(true)
  expect(resourceMatches('everything.*.match', 'everything.here.match')).toBe(true)
  expect(resourceMatches('everything.*.match.again', 'everything.here.match.again')).toBe(true)
  expect(resourceMatches('everything.*.*.again', 'everything.here.match.again')).toBe(true)
  expect(resourceMatches('*.will.*.again', 'everything.will.match.again')).toBe(true)
  expect(resourceMatches('everything', 'everything.will.match')).toBe(true)

  expect(resourceMatches('', 'nothing.will.match')).toBe(false)
  expect(resourceMatches('nothing.match', 'nothing.will.match')).toBe(false)
  expect(resourceMatches('this.*.match', 'nothing.will.match')).toBe(false)
  expect(resourceMatches('*.*.match', 'nothing.will.work')).toBe(false)
  expect(resourceMatches('a.b.c', 'b.a.c')).toBe(false)
  expect(resourceMatches('*.b.c', 'b.a.c')).toBe(false)
})

test('checkRule', () => {
  const rules = [
    // 2 chars
    { op: '+r', res: '1' },
    { op: '-w', res: '1' },
    { op: '+w', res: '1.a' },
    // 3 chars
    { op: '+rw', res: '2' },
    { op: '-rw', res: '2.a' },
    { op: '+r', res: '2.a.b' },
    // 4 chars
    { op: '+r+w', res: '2.a.c' },
    { op: '+r-w', res: '3' },
    { op: '+w-r', res: '3.a' }
  ]

  expect(checkRule(undefined, 'read', '1')).toBe(false)
  expect(checkRule(rules, 'read', '1')).toBe(true)
  expect(checkRule(rules, 'write', '1')).toBe(false)
  expect(checkRule(rules, 'write', '1.a')).toBe(true)
  expect(checkRule(rules, 'write', '1.b')).toBe(false)
  expect(checkRule(rules, 'read', '1.b')).toBe(true)

  expect(checkRule(rules, 'read', '2')).toBe(true)
  expect(checkRule(rules, 'write', '2')).toBe(true)
  expect(checkRule(rules, 'read', '2.b')).toBe(true)
  expect(checkRule(rules, 'write', '2.b')).toBe(true)
  expect(checkRule(rules, 'read', '2.a')).toBe(false)
  expect(checkRule(rules, 'write', '2.a')).toBe(false)
  expect(checkRule(rules, 'write', '2.a.b')).toBe(false)
  expect(checkRule(rules, 'read', '2.a.b')).toBe(true)
  expect(checkRule(rules, 'read', '2.a.c')).toBe(true)
  expect(checkRule(rules, 'write', '2.a.c')).toBe(true)

  expect(checkRule(rules, 'read', '3')).toBe(true)
  expect(checkRule(rules, 'write', '3')).toBe(false)
  expect(checkRule(rules, 'write', '3.a')).toBe(true)
  expect(checkRule(rules, 'read', '3.a')).toBe(false)
})

test('enrichResources', () => {
  const resources = [
    {
      name: 'x',
      children: [
        {
          name: 'y',
          children: [
            {
              name: 'z'
            }
          ]
        },
        {
          name: 't'
        }
      ]
    },
    {
      name: '1',
      children: [
        {
          name: '2'
        },
        {
          name: '3',
          children: [
            {
              name: 'a'
            }
          ]
        }
      ]
    }
  ]

  const enrichedResources = [
    {
      displayName: 'x',
      name: 'x',
      children: [
        {
          displayName: 'y',
          name: 'x.y',
          children: [
            {
              displayName: 'z',
              name: 'x.y.z'
            }
          ]
        },
        {
          displayName: 't',
          name: 'x.t'
        }
      ]
    },
    {
      displayName: '1',
      name: '1',
      children: [
        {
          displayName: '2',
          name: '1.2'
        },
        {
          displayName: '3',
          name: '1.3',
          children: [
            {
              displayName: 'a',
              name: '1.3.a'
            }
          ]
        }
      ]
    }
  ]

  expect(enrichResources(resources)).not.toBe(resources)
  expect(enrichResources(resources)).toEqual(enrichedResources)
})
