import { InstructionQueue } from './queue'

const context = {
  currentNode: {
    id: 'a54a82eb7c',
    name: 'entry',
    onEnter: ['enter {}'],
    onReceive: ['receive {}'],
    next: [{ condition: 'true', node: 'a-node' }]
  },
  currentFlow: {
    catchAll: {
      onReceive: ['flowReceive {}'],
      next: [{ condition: 'true', node: 'b-node' }]
    }
  }
}

describe('Instruction Queue', () => {
  let queue: InstructionQueue

  beforeEach(() => {
    queue = new InstructionQueue()
  })

  it('Enqueue from context', () => {
    const instructions = queue.createFromNode(context)

    expect(instructions[0]).toEqual({ fn: 'enter {}', type: 'on-enter' })
    expect(instructions[1]).toEqual({ type: 'wait' })
    expect(instructions[2]).toEqual({ fn: 'flowReceive {}', type: 'on-receive' })
    expect(instructions[3]).toEqual({ fn: 'receive {}', type: 'on-receive' })
    expect(instructions[4]).toEqual({ fn: 'true', node: 'b-node', type: 'transition' })
    expect(instructions[5]).toEqual({ fn: 'true', node: 'a-node', type: 'transition' })
  })

  it('Dequeue in order', () => {
    queue.enqueue({ type: 'on-enter', fn: 'a {}' }, { type: 'on-enter', fn: 'b {}' }, { type: 'on-enter', fn: 'c {}' })

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
