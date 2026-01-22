import { z } from 'zod'

export const StoredSheetRowSchema = z.object({
  id: z.string(),
  rowIndex: z.number(),
  data: z.record(z.string(), z.string().optional()),
  sourceSheet: z.string(),
  updatedAt: z.string(),
})

export type StoredSheetRow = z.infer<typeof StoredSheetRowSchema>
