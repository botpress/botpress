import { InstructionQueue } from './instruction-queue'

const context = {
  currentNode: {
    id: 'a54a82eb7c',
    name: 'entry',
    onEnter: ['enter {}'],
    onReceive: ['receive {}'],
    next: [{ condition: 'a !== b', node: 'another-node' }]
  },
  currentFlow: {
    catchAll: {
      onReceive: ['flowReceive {}'],
      next: undefined
    }
  }
}

describe('Instruction Queue', () => {
  let queue: InstructionQueue

  beforeEach(() => {
    queue = new InstructionQueue()
  })

  it('Enqueue in order', () => {
    const instructions = queue.enqueueContextInstructions(context)

    expect(instructions[4]).toEqual({ fn: 'enter {}', type: 'on-enter' })
    expect(instructions[3]).toEqual({ type: 'wait' })
    expect(instructions[2]).toEqual({ fn: 'flowReceive {}', type: 'on-receive' })
    expect(instructions[1]).toEqual({ fn: 'receive {}', type: 'on-receive' })
    expect(instructions[0]).toEqual({ type: 'transition', node: 'another-node', fn: 'a !== b' })
  })

  it('Dequeue in order', () => {
    queue.enqueue({ type: 'on-enter', fn: 'c {}' }, { type: 'on-enter', fn: 'b {}' }, { type: 'on-enter', fn: 'a {}' })

    expect(queue.dequeue()).toEqual({ type: 'on-enter', fn: 'a {}' })
    expect(queue.dequeue()).toEqual({ type: 'on-enter', fn: 'b {}' })
    expect(queue.dequeue()).toEqual({ type: 'on-enter', fn: 'c {}' })
  })

  it('Clear instructions', () => {
    queue.enqueue({ type: 'on-enter', fn: 'c {}' }, { type: 'on-enter', fn: 'b {}' }, { type: 'on-enter', fn: 'a {}' })

    queue.clear()

    expect(queue.dequeue()).toBe(undefined)
  })
})
