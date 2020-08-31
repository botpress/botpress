import { BaseScheduler } from './ml-thread-scheduler'

test('scheduler with 4 elements should create new elements only four times', async () => {
  // arrange
  const elements = ['A', 'B', 'C', 'D']
  const maxElement = 4

  let current = 0
  const elementGenerator = jest.fn(async () => {
    return elements[current++]
  })
  const scheduler = new BaseScheduler<string>(maxElement, elementGenerator)

  // act && assert
  expect(await scheduler.getNext()).toBe('A')
  expect(await scheduler.getNext()).toBe('B')
  expect(await scheduler.getNext()).toBe('C')
  expect(await scheduler.getNext()).toBe('D')
  expect(await scheduler.getNext()).toBe('A')
  expect(await scheduler.getNext()).toBe('B')
  expect(await scheduler.getNext()).toBe('C')
  expect(await scheduler.getNext()).toBe('D')
  expect(await scheduler.getNext()).toBe('A')
  expect(await scheduler.getNext()).toBe('B')
  expect(await scheduler.getNext()).toBe('C')
  expect(await scheduler.getNext()).toBe('D')

  expect(elementGenerator.mock.calls.length).toBe(maxElement)
})

test('scheduler with 1 element should create new element only once', async () => {
  // arrange
  const elements = ['A', 'B', 'C', 'D']
  const maxElement = 1

  let current = 0
  const elementGenerator = jest.fn(async () => {
    return elements[current++]
  })
  const scheduler = new BaseScheduler<string>(maxElement, elementGenerator)

  // act && assert
  expect(await scheduler.getNext()).toBe('A')
  expect(await scheduler.getNext()).toBe('A')
  expect(await scheduler.getNext()).toBe('A')

  expect(elementGenerator.mock.calls.length).toBe(maxElement)
})
