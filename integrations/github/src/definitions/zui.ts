import * as sdk from '@botpress/sdk'
const { z } = sdk

const StringComponent = {
  string: { text: { id: 'text', params: z.object({ multiLine: z.boolean(), growVertically: z.boolean() }) } },
} as const satisfies Pick<sdk.UIComponentDefinitions, 'string'>
type StringComponent = Omit<sdk.UIComponentDefinitions, 'string'> & typeof StringComponent

export const multiLineString = z
  .string()
  .displayAs<StringComponent>({ id: 'text', params: { multiLine: true, growVertically: true } })
