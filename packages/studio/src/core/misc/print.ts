import { PartialObject } from 'lodash'
import util from 'util'

export interface PrintOptions {
  colors: boolean
  depth: number
}

export const DefaultPrintOptions: PrintOptions = {
  colors: true,
  depth: 2
}

export function printObject(obj: any, opts: PartialObject<PrintOptions> = DefaultPrintOptions) {
  const options = { ...DefaultPrintOptions, opts }
  return util.inspect(obj, false, options.depth, options.colors)
}
