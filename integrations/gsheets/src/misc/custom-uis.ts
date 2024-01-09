import { z } from 'zod'
import * as schemas from './custom-schemas'

type SchemaOptions<T> = {
  title: string
  examples: T[]
}

type IsEmptyObject<T> = keyof T extends never ? true : false

type UiOf<TSchema extends z.AnyZodObject> = IsEmptyObject<z.infer<TSchema>> extends true
  ? Record<string, never>
  : {
      [K in keyof z.infer<TSchema>]: Partial<SchemaOptions<z.infer<TSchema>[K]>>
    }

export const getValuesUi = {
  range: {
    title: 'Range',
    examples: ['Sheet1!A1:B2'],
  },
} satisfies UiOf<typeof schemas.getValuesInputSchema>

export const updateValuesUi = {
  range: {
    title: 'Range',
    examples: ['Sheet1!A1:B2'],
  },
  values: {
    title: 'Values',
    examples: [
      [
        ['a', 'b'],
        ['c', 'd'],
      ],
    ],
  },
} satisfies UiOf<typeof schemas.updateValuesInputSchema>

export const appendValuesUi = {
  range: {
    title: 'Range',
    examples: ['Sheet1!A1:B2'],
  },
  values: {
    title: 'Values',
    examples: [
      [
        ['a', 'b'],
        ['c', 'd'],
      ],
    ],
  },
} satisfies UiOf<typeof schemas.appendValuesInputSchema>

export const clearValuesUi = {
  range: {
    title: 'Range',
    examples: ['Sheet1!A1:B2'],
  },
} satisfies UiOf<typeof schemas.clearValuesInputSchema>

export const getInfoUi = {
  fields: {
    title: 'Fields',
    examples: [['spreadsheetId', 'properties.title', 'sheets.properties.sheetId', 'sheets.properties.title']],
  },
} satisfies UiOf<typeof schemas.getInfoInputSchema>

export const addSheetUi = {
  title: {
    title: 'Title',
  },
} satisfies UiOf<typeof schemas.addSheetInputSchema>
