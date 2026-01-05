import { describe, it, expect } from 'vitest'
import { parseString } from './parseString'

describe('parseString', () => {
  // TODO: this is error prone since the test now depends on the build artefact
  const run = (output: string, data: unknown) =>
    eval(
      `console.log(process.cwd()); const {z} = require("@bpinternal/zui"); ${output}.safeParse(${JSON.stringify(data)})`,
    )

  it('DateTime format', () => {
    const datetime = '2018-11-13T20:20:39Z'

    expect(run(parseString({ type: 'string', format: 'date-time' }), datetime)).toStrictEqual({
      success: true,
      data: datetime,
    })
  })

  it('should accept errorMessage', () => {
    expect(
      parseString({
        type: 'string',
        format: 'ipv4',
        pattern: 'x',
        minLength: 1,
        maxLength: 2,
        errorMessage: {
          format: 'ayy',
          pattern: 'lmao',
          minLength: 'deez',
          maxLength: 'nuts',
        },
      }),
    ).toStrictEqual(
      'z.string().ip({ version: "v4", message: "ayy" }).regex(new RegExp("x"), "lmao").min(1, "deez").max(2, "nuts")',
    )
  })
})
