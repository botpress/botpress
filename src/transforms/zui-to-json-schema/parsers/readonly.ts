import { ZodReadonlyDef } from '../../../z/index'
import { parseDef } from '../parseDef'
import { Refs } from '../Refs'

export const parseReadonlyDef = (def: ZodReadonlyDef<any>, refs: Refs) => {
  return parseDef(def.innerType._def, refs)
}
