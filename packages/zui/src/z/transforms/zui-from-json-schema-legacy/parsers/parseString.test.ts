import { describe, it, expect } from 'vitest'
import { parseString } from './parseString'
import { evalZuiString } from '../../common/eval-zui-string'

describe('parseString', () => {
  const run = (output: string, data: unknown) => {
    const evalResult = evalZuiString(output)
    if (!evalResult.sucess) {
      throw new Error(`Failed to evaluate ZUI string: ${evalResult.error}`)
    }
    const zSchema = evalResult.value
    return zSchema.safeParse(data)
  }

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
      })
    ).toStrictEqual(
      'z.string().ip({ version: "v4", message: "ayy" }).regex(new RegExp("x"), "lmao").min(1, "deez").max(2, "nuts")'
    )
  })
})
