import { BaseScheduler } from './worker-scheduler'

test('scheduler with 4 elements doesnt messes up', () => {
  // arrange
  const elements = ['A', 'B', 'C', 'D']
  const maxElement = 4

  let current = 0
  const elementGenerator = jest.fn(() => {
    return elements[current++]
  })
  const scheduler = new BaseScheduler<string>(maxElement, elementGenerator)

  // act && assert
  expect(scheduler.getNext()).toBe('A')
  expect(scheduler.getNext()).toBe('B')
  expect(scheduler.getNext()).toBe('C')
  expect(scheduler.getNext()).toBe('D')
  expect(scheduler.getNext()).toBe('A')
  expect(scheduler.getNext()).toBe('B')
  expect(scheduler.getNext()).toBe('C')
  expect(scheduler.getNext()).toBe('D')
  expect(scheduler.getNext()).toBe('A')
  expect(scheduler.getNext()).toBe('B')
  expect(scheduler.getNext()).toBe('C')
  expect(scheduler.getNext()).toBe('D')

  expect(elementGenerator.mock.calls.length).toBe(maxElement)
})

test('scheduler with 1 element doesnt messes up', () => {
  // arrange
  const elements = ['A', 'B', 'C', 'D']
  const maxElement = 1

  let current = 0
  const elementGenerator = jest.fn(() => {
    return elements[current++]
  })
  const scheduler = new BaseScheduler<string>(maxElement, elementGenerator)

  // act && assert
  expect(scheduler.getNext()).toBe('A')
  expect(scheduler.getNext()).toBe('A')
  expect(scheduler.getNext()).toBe('A')

  expect(elementGenerator.mock.calls.length).toBe(maxElement)
})
