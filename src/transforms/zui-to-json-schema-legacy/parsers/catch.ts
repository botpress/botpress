import { ZodCatchDef } from '../../../z/index'
import { parseDef } from '../parseDef'
import { Refs } from '../Refs'

export const parseCatchDef = (def: ZodCatchDef<any>, refs: Refs) => {
  return parseDef(def.innerType._def, refs)
}
