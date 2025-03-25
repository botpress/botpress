import { Logger } from '.'
import { test, expect } from 'vitest'

type _IFakeStream = Partial<NodeJS.WriteStream> & {
  data: string
}
class _FakeStream implements _IFakeStream {
  private _lines: string[] = []
  private _y = 0
  private _x = 0

  public static create(): _IFakeStream {
    return new _FakeStream()
  }

  private get _currentLine(): string {
    return this._lines[this._y] || ''
  }

  private set _currentLine(line: string) {
    this._lines[this._y] = line
  }

  public write(str: Uint8Array | string): boolean {
    const tokens: string[] = str.toString().split(/(\n)/).filter(Boolean)

    for (const token of tokens) {
      if (token === '\n') {
        this._y++
        this._currentLine = ''
        continue
      }
      this._currentLine = this._currentLine + token
    }

    return true
  }

  public clearLine(dir: -1 | 0 | 1) {
    if (dir === 0) {
      this._currentLine = ''
    } else if (dir === -1) {
      const right = this._currentLine.slice(this._x)
      this._currentLine = right
    } else {
      const left = this._currentLine.slice(0, this._x)
      this._currentLine = left
    }
    return true
  }

  public cursorTo(x: number, y?: number | Function): boolean {
    this._x = x
    this._y = typeof y === 'number' ? y : this._y
    return true
  }

  public get data(): string {
    return this._lines.join('\n')
  }
}

test('logging with a prefix should write the prefix', () => {
  const stream = _FakeStream.create()
  const logger = new Logger({ outStream: stream as NodeJS.WriteStream, errStream: stream as NodeJS.WriteStream })

  logger.log('lol1', { prefix: '###' })
  expect(stream.data).toEqual('### lol1\n')
})

test('logging a certain sequence of messages should write message in order', () => {
  const stream = _FakeStream.create()
  const logger = new Logger({ outStream: stream as NodeJS.WriteStream, errStream: stream as NodeJS.WriteStream })

  logger.log('lol1')
  logger.log('lol2')
  logger.log('lol3')
  logger.log('lol4')

  expect(stream.data).toEqual(`lol1
lol2
lol3
lol4
`)
})

test('logging on a single line should write message on a single line', () => {
  const stream = _FakeStream.create()
  const logger = new Logger({ outStream: stream as NodeJS.WriteStream, errStream: stream as NodeJS.WriteStream }).line()
  logger.log('lol1')
  logger.log('lol2')
  logger.log('lol3')
  logger.log('lol4')

  expect(stream.data).toEqual('lol4')
})

test('logging on a single line, then logging on multiple line should keep logging on next line', () => {
  const stream = _FakeStream.create()

  const logger = new Logger({ outStream: stream as NodeJS.WriteStream, errStream: stream as NodeJS.WriteStream })
  logger.log('lol1')

  const line = logger.line()
  line.log('lol2')
  line.log('lol3')
  logger.log('lol4')
  line.log('lol5')

  expect(stream.data).toEqual(`lol1
lol3
lol4
lol5
`)
})
