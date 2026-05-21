import { z } from './packages/zui/src/index'

const zSchema = z.object({
  foos: z.array(
    z.record(
      z.string(),
      z.object({
        bar: z.string().refine((val) => val.length < 5),
      })
    )
  ),
})

const jSchema = zSchema.toJSONSchema() // #.foos[*][*].bar

console.log(JSON.stringify(jSchema, null, 2))
