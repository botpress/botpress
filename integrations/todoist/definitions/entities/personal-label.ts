import { z } from '@botpress/sdk'
import { Color } from './color'

// documentation for Label: https://developer.todoist.com/rest/v2/#labels

export namespace PersonalLabel {
  const _fields = {
    id: z.string().title('ID').describe('The ID of the label.'),
    name: z.string().title('Name').describe('The name of the label.'),
    color: z.enum(Color.names).title('Color Name').describe('The color of the label.'),
    orderWithinList: z
      .number()
      .title('Order Within List')
      .nonnegative()
      .describe("Numerical index indicating label's order within the user's label list."),
    isFavorite: z.boolean().title('Is Favorite?').describe('Whether the label is marked as favorite or not.'),
  } as const

  export const schema = z.object(_fields)
  export type InferredType = z.infer<typeof schema>
}
