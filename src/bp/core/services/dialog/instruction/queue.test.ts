import { InstructionQueue } from './queue'

describe('Instruction Queue', () => {
  const queue = new InstructionQueue()

  beforeEach(() => {
    queue.enqueue({ type: 'on-enter', fn: 'abc {}' }, { type: 'on-enter', fn: 'def {}' })
  })

  afterEach(() => {
    queue.clear()
  })

  describe('Has instructions', () => {
    it('Returns true when not empty', () => {
      expect(queue.hasInstructions()).toBeTruthy()
    })
  })

  describe('Enqueue', () => {
    it('Add element to the end of the queue', () => {
      queue.enqueue({ type: 'on-enter', fn: 'xyz {}' })
      const instructions = queue.instructions
      expect(instructions[instructions.length - 1]).toEqual({ type: 'on-enter', fn: 'xyz {}' })
    })
  })

  describe('Dequeue', () => {
    it('Returns the first element in the queue', () => {
      queue.enqueue({ type: 'on-enter', fn: 'abc {}' }, { type: 'on-enter', fn: 'def {}' })

      const value = queue.dequeue()
      expect(value).toEqual({ type: 'on-enter', fn: 'abc {}' })
    })
  })

  describe('Clear', () => {
    it('Clears the instructions queue', () => {
      queue.clear()
      expect(queue.instructions.length).toEqual(0)
    })
  })

  describe('Wait', () => {
    it('Insert wait at the start of the queue', () => {
      queue.wait()
      expect(queue.instructions[0]).toEqual({ type: 'wait' })
    })
  })
})
