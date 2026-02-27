import { test, expect } from 'vitest'
import * as utils from '../../utils'
import * as z from '../../index'

enum testEnum {
  A,
  B,
}

const schemas = [
  z.string().readonly(),
  z.number().readonly(),
  z.nan().readonly(),
  z.bigint().readonly(),
  z.boolean().readonly(),
  z.date().readonly(),
  z.undefined().readonly(),
  z.null().readonly(),
  z.any().readonly(),
  z.unknown().readonly(),
  z.void().readonly(),
  z.function().args(z.string(), z.number()).readonly(),

  z.array(z.string()).readonly(),
  z.tuple([z.string(), z.number()]).readonly(),
  z.map(z.string(), z.date()).readonly(),
  z.set(z.promise(z.string())).readonly(),
  z.record(z.string()).readonly(),
  z.record(z.string(), z.number()).readonly(),
  z.object({ a: z.string(), 1: z.number() }).readonly(),
  z.nativeEnum(testEnum).readonly(),
  z.promise(z.string()).readonly(),
] as const

test('flat inference', () => {
  utils.assert.assertEqual<z.infer<(typeof schemas)[0]>, string>(true)
  utils.assert.assertEqual<z.infer<(typeof schemas)[1]>, number>(true)
  utils.assert.assertEqual<z.infer<(typeof schemas)[2]>, number>(true)
  utils.assert.assertEqual<z.infer<(typeof schemas)[3]>, bigint>(true)
  utils.assert.assertEqual<z.infer<(typeof schemas)[4]>, boolean>(true)
  utils.assert.assertEqual<z.infer<(typeof schemas)[5]>, Date>(true)
  utils.assert.assertEqual<z.infer<(typeof schemas)[6]>, undefined>(true)
  utils.assert.assertEqual<z.infer<(typeof schemas)[7]>, null>(true)
  utils.assert.assertEqual<z.infer<(typeof schemas)[8]>, any>(true)
  utils.assert.assertEqual<z.infer<(typeof schemas)[9]>, Readonly<unknown>>(true)
  utils.assert.assertEqual<z.infer<(typeof schemas)[10]>, void>(true)
  utils.assert.assertEqual<
    z.infer<(typeof schemas)[11]>,
    (args_0: string, args_1: number, ...args_2: unknown[]) => unknown
  >(true)
  utils.assert.assertEqual<z.infer<(typeof schemas)[12]>, readonly string[]>(true)

  utils.assert.assertEqual<z.infer<(typeof schemas)[13]>, readonly [string, number]>(true)
  utils.assert.assertEqual<z.infer<(typeof schemas)[14]>, ReadonlyMap<string, Date>>(true)
  utils.assert.assertEqual<z.infer<(typeof schemas)[15]>, ReadonlySet<Promise<string>>>(true)
  utils.assert.assertEqual<z.infer<(typeof schemas)[16]>, Readonly<Record<string, string>>>(true)
  utils.assert.assertEqual<z.infer<(typeof schemas)[17]>, Readonly<Record<string, number>>>(true)
  utils.assert.assertEqual<z.infer<(typeof schemas)[18]>, { readonly a: string; readonly 1: number }>(true)
  utils.assert.assertEqual<z.infer<(typeof schemas)[19]>, Readonly<testEnum>>(true)
  utils.assert.assertEqual<z.infer<(typeof schemas)[20]>, Promise<string>>(true)
})

// test("deep inference", () => {
//   utils.assert.assertEqual<z.infer<(typeof deepReadonlySchemas_0)[0]>, string>(true);
//   utils.assert.assertEqual<z.infer<(typeof deepReadonlySchemas_0)[1]>, number>(true);
//   utils.assert.assertEqual<z.infer<(typeof deepReadonlySchemas_0)[2]>, number>(true);
//   utils.assert.assertEqual<z.infer<(typeof deepReadonlySchemas_0)[3]>, bigint>(true);
//   utils.assert.assertEqual<z.infer<(typeof deepReadonlySchemas_0)[4]>, boolean>(true);
//   utils.assert.assertEqual<z.infer<(typeof deepReadonlySchemas_0)[5]>, Date>(true);
//   utils.assert.assertEqual<z.infer<(typeof deepReadonlySchemas_0)[6]>, undefined>(true);
//   utils.assert.assertEqual<z.infer<(typeof deepReadonlySchemas_0)[7]>, null>(true);
//   utils.assert.assertEqual<z.infer<(typeof deepReadonlySchemas_0)[8]>, any>(true);
//   utils.assert.assertEqual<
//     z.infer<(typeof deepReadonlySchemas_0)[9]>,
//     Readonly<unknown>
//   >(true);
//   utils.assert.assertEqual<z.infer<(typeof deepReadonlySchemas_0)[10]>, void>(true);
//   utils.assert.assertEqual<
//     z.infer<(typeof deepReadonlySchemas_0)[11]>,
//     (args_0: string, args_1: number, ...args_2: unknown[]) => unknown
//   >(true);
//   utils.assert.assertEqual<
//     z.infer<(typeof deepReadonlySchemas_0)[12]>,
//     readonly string[]
//   >(true);
//   utils.assert.assertEqual<
//     z.infer<(typeof deepReadonlySchemas_0)[13]>,
//     readonly [string, number]
//   >(true);
//   utils.assert.assertEqual<
//     z.infer<(typeof deepReadonlySchemas_0)[14]>,
//     ReadonlyMap<string, Date>
//   >(true);
//   utils.assert.assertEqual<
//     z.infer<(typeof deepReadonlySchemas_0)[15]>,
//     ReadonlySet<Promise<string>>
//   >(true);
//   utils.assert.assertEqual<
//     z.infer<(typeof deepReadonlySchemas_0)[16]>,
//     Readonly<Record<string, string>>
//   >(true);
//   utils.assert.assertEqual<
//     z.infer<(typeof deepReadonlySchemas_0)[17]>,
//     Readonly<Record<string, number>>
//   >(true);
//   utils.assert.assertEqual<
//     z.infer<(typeof deepReadonlySchemas_0)[18]>,
//     { readonly a: string; readonly 1: number }
//   >(true);
//   utils.assert.assertEqual<
//     z.infer<(typeof deepReadonlySchemas_0)[19]>,
//     Readonly<testEnum>
//   >(true);
//   utils.assert.assertEqual<
//     z.infer<(typeof deepReadonlySchemas_0)[20]>,
//     Promise<string>
//   >(true);

//   utils.assert.assertEqual<
//     z.infer<typeof crazyDeepReadonlySchema>,
//     ReadonlyMap<
//       ReadonlySet<readonly [string, number]>,
//       {
//         readonly a: {
//           readonly [x: string]: readonly any[];
//         };
//         readonly b: {
//           readonly c: {
//             readonly d: {
//               readonly e: {
//                 readonly f: {
//                   readonly g?: {};
//                 };
//               };
//             };
//           };
//         };
//       }
//     >
//   >(true);
// });

test('object freezing', () => {
  expect(Object.isFrozen(z.array(z.string()).readonly().parse(['a']))).toBe(true)
  expect(Object.isFrozen(z.tuple([z.string(), z.number()]).readonly().parse(['a', 1]))).toBe(true)
  expect(
    Object.isFrozen(
      z
        .map(z.string(), z.date())
        .readonly()
        .parse(new Map([['a', new Date()]]))
    )
  ).toBe(true)
  expect(
    Object.isFrozen(
      z
        .set(z.promise(z.string()))
        .readonly()
        .parse(new Set([Promise.resolve('a')]))
    )
  ).toBe(true)
  expect(Object.isFrozen(z.record(z.string()).readonly().parse({ a: 'b' }))).toBe(true)
  expect(Object.isFrozen(z.record(z.string(), z.number()).readonly().parse({ a: 1 }))).toBe(true)
  expect(Object.isFrozen(z.object({ a: z.string(), 1: z.number() }).readonly().parse({ a: 'b', 1: 2 }))).toBe(true)
  expect(Object.isFrozen(z.promise(z.string()).readonly().parse(Promise.resolve('a')))).toBe(true)
})
