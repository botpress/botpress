import boxen from 'boxen'
import chalk from 'chalk'
import _ from 'lodash'
import util from 'util'
import * as utils from '../utils'

export type LoggerOptions = {
  verbose: boolean
  json?: boolean // prevents loggin anything else than json
}

const STDOUT_CHUNK_SIZE = 100
const DEFAULT_OPTIONS: LoggerOptions = { verbose: false }

type ChalkColor = (str: string) => string
const NO_COLOR: ChalkColor = (str: string) => str

const PINK = [255, 100, 255] as const
const ORANGE = [255, 165, 0] as const
const PURPLE = [128, 0, 128] as const

const BG_COLORS: Record<Color, ChalkColor> = {
  blue: chalk.bgBlueBright,
  green: chalk.bgGreenBright,
  yellow: chalk.bgYellowBright,
  red: chalk.bgRedBright,
  white: chalk.bgWhite,
  pink: (str: string) => chalk.bgRgb(...PINK)(str),
  orange: (str: string) => chalk.bgRgb(...ORANGE)(str),
  purple: (str: string) => chalk.bgRgb(...PURPLE)(str),
}

const FG_COLORS: Record<Color, ChalkColor> = {
  blue: chalk.blueBright,
  green: chalk.green,
  yellow: chalk.yellowBright,
  red: chalk.red,
  white: chalk.white,
  pink: (str: string) => chalk.rgb(...PINK)(str),
  orange: (str: string) => chalk.rgb(...ORANGE)(str),
  purple: (str: string) => chalk.rgb(...PURPLE)(str),
}

type Symbol = '✓' | '⚠' | '×' | '●' | ' ' | '○'
type Color = 'blue' | 'green' | 'yellow' | 'red' | 'pink' | 'white' | 'orange' | 'purple'
type LogPrefix = { symbol: Symbol; fg?: Color; bg?: Color; indent?: number } | string
type SymbolRenderer<T extends Symbol> = { default: T; windows?: string; mac?: string }

type LogProps = {
  prefix: LogPrefix
  stderr?: boolean
}

type PrintProps = {
  metadata: any
  prefix: string
  stderr?: boolean
}

const checkmark: SymbolRenderer<'✓'> = {
  default: '✓',
  windows: '√',
  mac: '✔',
}

const cross: SymbolRenderer<'×'> = {
  default: '×',
  mac: '✖',
}

const danger: SymbolRenderer<'⚠'> = { default: '⚠' }
const circle: SymbolRenderer<'○'> = { default: '○' }
const disc: SymbolRenderer<'●'> = { default: '●' }
const space: SymbolRenderer<' '> = { default: ' ' }

const renderers: Record<Symbol, SymbolRenderer<Symbol>> = {
  '✓': checkmark,
  '×': cross,
  '⚠': danger,
  '○': circle,
  '●': disc,
  ' ': space,
}

const BOX_OPTIONS: boxen.Options = {
  padding: 1,
  margin: 1,
  borderStyle: 'round',
  borderColor: 'yellow',
}

export abstract class BaseLogger {
  protected opts: LoggerOptions

  constructor(opts: Partial<LoggerOptions> = {}) {
    this.opts = { ...DEFAULT_OPTIONS, ...opts }
  }

  public log(message: string, props: Partial<LogProps> = {}): void {
    if (this.opts.json && !props.stderr) {
      return
    }

    const prefix = this._resolvePrefix(props.prefix)
    this.print(message, { ...props, prefix })
  }

  public json(data: any, opts: Partial<{ depth: number }> = { depth: Infinity }): void {
    if (this.opts.json) {
      this.print(JSON.stringify(data, undefined, 2))
      return
    }

    const { depth } = opts
    const msg = util.inspect(data, { colors: true, depth })
    this.log(msg)
  }

  public debug(message: string): void {
    if (!this.opts.verbose) {
      return
    }
    this.log(chalk.grey(message), { prefix: { symbol: '●', fg: 'blue' } })
  }

  public started(message: string): void {
    this.log(message, { prefix: { symbol: '○', fg: 'purple' } })
  }

  public success(message: string): void {
    this.log(message, { prefix: { symbol: '✓', fg: 'green' } })
  }

  public warn(message: string): void {
    this.log(message, { prefix: { symbol: '⚠', fg: 'yellow' } })
  }

  public error(message: string): void {
    this.log(message, { prefix: { symbol: '×', fg: 'red' }, stderr: true })
  }

  public box(message: string): void {
    const box = boxen(message, BOX_OPTIONS)
    this.log(box)
  }

  protected abstract print(message: string, props?: Partial<PrintProps>): void

  private _resolvePrefix(prefix: LogPrefix | undefined): string | undefined {
    if (!prefix) {
      return
    }

    if (_.isString(prefix)) {
      return prefix
    }

    const { symbol, fg, bg, indent } = prefix
    const renderedSymbol = this._renderSymbol(symbol)
    const fgcolor = fg ? FG_COLORS[fg] : NO_COLOR
    const bgcolor = bg ? BG_COLORS[bg] : NO_COLOR
    const indentStr = indent ? ' '.repeat(indent) : ''
    const symbolStr = fgcolor(bgcolor(renderedSymbol))
    return `${indentStr}${symbolStr}`
  }

  private _renderSymbol(symbol: Symbol): string {
    const renderer = renderers[symbol]
    if (process.platform === 'win32') {
      return renderer.windows || renderer.default
    } else if (process.platform === 'darwin') {
      return renderer.mac || renderer.default
    } else {
      return renderer.default
    }
  }

  protected render(message: string, stream: NodeJS.WriteStream = process.stdout): void {
    // chunking the message ensures that the process won't exit before the message is fully written
    for (const chunk of utils.string.chunkString(message, STDOUT_CHUNK_SIZE)) {
      stream.write(chunk)
    }
  }
}
