import 'reflect-metadata'

import { InstructionFactory } from './instruction-factory'
import { context } from './stubs'

describe('Instruction Factory', () => {
  it('Create on enter instructions', () => {
    const instructionFactory = new InstructionFactory()
    const onEnter = instructionFactory.createOnEnter(context)
    expect(onEnter).toEqual([{ fn: 'debug {}', type: 'on-enter' }])
  })
})
