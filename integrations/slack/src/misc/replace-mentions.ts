import { z } from '@botpress/sdk'
import { textSchema } from 'definitions/schemas/text-input'
export type Mention = NonNullable<z.infer<typeof textSchema>['mentions']>[number]

export const replaceMentions = (text: string, mentions: Mention[] | undefined): string => {
  if (!mentions) {
    return text
  }

  mentions.sort((a, b) => b.start - a.start)
  for (const mention of mentions) {
    text = text.replace(mention.user.name, mention.user.id)
  }

  return text
}
