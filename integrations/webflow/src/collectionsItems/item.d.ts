import { z } from "@botpress/sdk"
import { itemSchemaInput, itemSchemaOutput, paginationSchema } from "./itemSchema"

export type ItemOutput = z.infer<typeof itemSchemaOutput>
export type ItemInput = z.infer<typeof itemSchemaInput>
export type Pagination = z.infer<typeof paginationSchema>
