import { parseActionInstruction } from './action'

describe('parseActionInstruction', () => {
  it('no params', () => {
    const result = parseActionInstruction('myserver:myaction')
    expect(result).toEqual({
      actionName: 'myaction',
      argsStr: '',
      actionServerId: 'myserver'
    })
  })

  it('empty params', () => {
    const result = parseActionInstruction('myserver:myaction {}')
    expect(result).toEqual({
      actionName: 'myaction',
      argsStr: '{}',
      actionServerId: 'myserver'
    })
  })

  it('action with module', () => {
    const result = parseActionInstruction('somemodule/myaction {}')
    expect(result).toEqual({
      actionName: 'somemodule/myaction',
      argsStr: '{}',
      actionServerId: undefined
    })
  })

  it('no spaces in params', () => {
    const result = parseActionInstruction('myserver:myaction {"type":"temp","name":"bleh","value":"lol"}')
    expect(result).toEqual({
      actionName: 'myaction',
      argsStr: '{"type":"temp","name":"bleh","value":"lol"}',
      actionServerId: 'myserver'
    })
  })

  it('1 space in params', () => {
    const result = parseActionInstruction('myserver:myaction {"type":"temp ","name":"bleh","value":"lol"}')
    expect(result).toEqual({
      actionName: 'myaction',
      argsStr: '{"type":"temp ","name":"bleh","value":"lol"}',
      actionServerId: 'myserver'
    })
  })

  it('many spaces in params', () => {
    const result = parseActionInstruction('myserver:myaction {"type":"temp ","name": "bleh","value":" lo l"}')
    expect(result).toEqual({
      actionName: 'myaction',
      argsStr: '{"type":"temp ","name": "bleh","value":" lo l"}',
      actionServerId: 'myserver'
    })
  })

  it('no server with many spaces in params', () => {
    const result = parseActionInstruction('myaction {"type":"temp ","name": "bleh","value":" lo l"}')
    expect(result).toEqual({
      actionName: 'myaction',
      argsStr: '{"type":"temp ","name": "bleh","value":" lo l"}',
      actionServerId: undefined
    })
  })

  it('params with JSON errors', () => {
    const result = parseActionInstruction('myaction {"type:"temp","name": "bleh","value":" lol"}')
    expect(result).toEqual({
      actionName: 'myaction',
      argsStr: '{"type:"temp","name": "bleh","value":" lol"}',
      actionServerId: undefined
    })
  })
})
