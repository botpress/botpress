import { Options, Targets } from '../../Options'
import { getRefs, Refs } from '../../Refs'

export function errorReferences(options?: string | Partial<Options<Targets>>): Refs {
  const r = getRefs(options)
  r.errorMessages = true
  return r
}
