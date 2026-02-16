import { test } from 'vitest'
import * as z from '../index'
import { util } from './utils'

test('first party switch', () => {
  const myType = z.ZodString.create() as z.ZodNativeSchema

  switch (myType.typeName) {
    case 'ZodString':
      myType satisfies z.ZodString
      break
    case 'ZodNumber':
      myType satisfies z.ZodNumber
      break
    case 'ZodNaN':
      myType satisfies z.ZodNaN
      break
    case 'ZodBigInt':
      myType satisfies z.ZodBigInt
      break
    case 'ZodBoolean':
      myType satisfies z.ZodBoolean
      break
    case 'ZodDate':
      myType satisfies z.ZodDate
      break
    case 'ZodUndefined':
      myType satisfies z.ZodUndefined
      break
    case 'ZodNull':
      myType satisfies z.ZodNull
      break
    case 'ZodAny':
      myType satisfies z.ZodAny
      break
    case 'ZodUnknown':
      myType satisfies z.ZodUnknown
      break
    case 'ZodNever':
      myType satisfies z.ZodNever
      break
    case 'ZodVoid':
      myType satisfies z.ZodVoid
      break
    case 'ZodArray':
      myType satisfies z.ZodArray
      break
    case 'ZodObject':
      myType satisfies z.ZodObject
      break
    case 'ZodUnion':
      myType satisfies z.ZodUnion
      break
    case 'ZodDiscriminatedUnion':
      myType satisfies z.ZodDiscriminatedUnion
      break
    case 'ZodIntersection':
      myType satisfies z.ZodIntersection
      break
    case 'ZodTuple':
      myType satisfies z.ZodTuple
      break
    case 'ZodRecord':
      myType satisfies z.ZodRecord
      break
    case 'ZodRef':
      myType satisfies z.ZodRef
      break
    case 'ZodMap':
      myType satisfies z.ZodMap
      break
    case 'ZodSet':
      myType satisfies z.ZodSet
      break
    case 'ZodFunction':
      myType satisfies z.ZodFunction
      break
    case 'ZodLazy':
      myType satisfies z.ZodLazy
      break
    case 'ZodLiteral':
      myType satisfies z.ZodLiteral
      break
    case 'ZodEnum':
      myType satisfies z.ZodEnum
      break
    case 'ZodEffects':
      myType satisfies z.ZodEffects
      break
    case 'ZodNativeEnum':
      myType satisfies z.ZodNativeEnum
      break
    case 'ZodOptional':
      myType satisfies z.ZodOptional
      break
    case 'ZodNullable':
      myType satisfies z.ZodNullable
      break
    case 'ZodDefault':
      myType satisfies z.ZodDefault
      break
    case 'ZodCatch':
      myType satisfies z.ZodCatch
      break
    case 'ZodPromise':
      myType satisfies z.ZodPromise
      break
    case 'ZodBranded':
      myType satisfies z.ZodBranded
      break
    case 'ZodPipeline':
      myType satisfies z.ZodPipeline
      break
    case 'ZodSymbol':
      myType satisfies z.ZodSymbol
      break
    case 'ZodReadonly':
      myType satisfies z.ZodReadonly
      break
    default:
      util.assertNever(myType)
  }
})
