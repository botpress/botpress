import { Augmentation, createAugmenter, interleave } from './augmenter'

const a = {
  slotName: 'a',
  examples: ['A1', 'A2', 'A3', 'A4', 'A5']
} as Augmentation

const b = {
  slotName: 'b',
  examples: ['B1', 'B2']
} as Augmentation

const c = {
  slotName: 'c',
  examples: ['C1']
} as Augmentation

test('augment utterance with no slot', () => {
  const augmenter = createAugmenter([])
  const utterance = 'Hello, world!'

  for (let i = 0; i <= 5; i++) {
    expect(augmenter(utterance)).toEqual(utterance)
  }
})

test('augment utterance with slots but no variables', () => {
  const augmenter = createAugmenter([])
  const utterance = 'Hello, $a $b $c World!'

  for (let i = 0; i <= 5; i++) {
    expect(augmenter(utterance)).toEqual(utterance)
  }
})

test('augment utterance with no slot but variables', () => {
  const augmenter = createAugmenter([a, b, c])
  const utterance = 'Hello, World!'

  for (let i = 0; i <= 5; i++) {
    expect(augmenter(utterance)).toEqual(utterance)
  }
})

test('augment utterance with rolling variables', () => {
  const augmenter = createAugmenter([a, b, c])
  const utterance = 'Hello, $a $b $c World!'

  expect(augmenter(utterance)).toEqual('Hello, [A1](a) [B1](b) [C1](c) World!')
  expect(augmenter(utterance)).toEqual('Hello, [A2](a) [B2](b) [C1](c) World!')
  expect(augmenter(utterance)).toEqual('Hello, [A3](a) [B1](b) [C1](c) World!')
  expect(augmenter(utterance)).toEqual('Hello, [A4](a) [B2](b) [C1](c) World!')
  expect(augmenter(utterance)).toEqual('Hello, [A5](a) [B1](b) [C1](c) World!')
  expect(augmenter(utterance)).toEqual('Hello, [A1](a) [B2](b) [C1](c) World!')
  expect(augmenter(utterance)).toEqual('Hello, [A2](a) [B1](b) [C1](c) World!')
  expect(augmenter(utterance)).toEqual('Hello, [A3](a) [B2](b) [C1](c) World!')
})

test('interleave', () => {
  const result = interleave(['a', 'b', 'c', 'd'], ['1', '2'], ['!'])
  expect(result.join(' ')).toEqual('a 1 ! b 2 c d')
})
