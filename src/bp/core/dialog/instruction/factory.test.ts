import { InstructionFactory } from './factory'

describe('Instruction Factory', () => {
  describe('Create on enter', () => {
    it('Returns instructions in order', () => {
      const node = {
        onEnter: ['abc {}', 'def {}']
      }

      const value = InstructionFactory.createOnEnter(node)
      expect(value).toEqual([
        { type: 'on-enter', fn: 'abc {}' },
        { type: 'on-enter', fn: 'def {}' }
      ])
    })
  })

  describe('Create on receive', () => {
    const node = {
      onReceive: ['abc {}', 'def {}']
    }

    it('Returns instructions in order', () => {
      const flow = {}
      const value = InstructionFactory.createOnReceive(node, flow)
      expect(value).toEqual([
        { type: 'on-receive', fn: 'abc {}' },
        { type: 'on-receive', fn: 'def {}' }
      ])
    })

    it('Create flow level instructions before node level instructions', () => {
      const flow = {
        catchAll: {
          onReceive: ['xyz {}']
        }
      }
      const value = InstructionFactory.createOnReceive(node, flow)
      expect(value).toEqual([
        { type: 'on-receive', fn: 'xyz {}' },
        { type: 'on-receive', fn: 'abc {}' },
        { type: 'on-receive', fn: 'def {}' }
      ])
    })
  })

  describe('Create transition', () => {
    const node = {
      next: [
        { condition: 'abc {}', node: 'x' },
        { condition: 'def {}', node: 'y' }
      ]
    }

    it('Returns transitions in order', () => {
      const flow = {}
      const value = InstructionFactory.createTransition(flow, node)
      expect(value).toEqual([
        { type: 'transition', fn: 'abc {}', node: 'x' },
        { type: 'transition', fn: 'def {}', node: 'y' }
      ])
    })

    it('Create flow level transition before node level transition', () => {
      const flow = {
        catchAll: {
          next: [{ condition: 'xyz {}', node: 'a' }]
        }
      }
      const value = InstructionFactory.createTransition(flow, node)
      expect(value).toEqual([
        { type: 'transition', fn: 'xyz {}', node: 'a' },
        { type: 'transition', fn: 'abc {}', node: 'x' },
        { type: 'transition', fn: 'def {}', node: 'y' }
      ])
    })

    it('Skip transitions that contain the current node', () => {
      const node = { name: 'abc' }
      const flow = {
        catchAll: {
          next: [
            { condition: 'xyz {}', node: 'abc' },
            { condition: 'xyz {}', node: 'bcd' }
          ]
        }
      }
      const value = InstructionFactory.createTransition(flow, node)
      expect(value).toEqual([{ type: 'transition', fn: 'xyz {}', node: 'bcd' }])
    })
  })

  describe('Create wait', () => {
    it('Returns a wait instruction', () => {
      const value = InstructionFactory.createWait()
      expect(value).toEqual({ type: 'wait' })
    })
  })
})
