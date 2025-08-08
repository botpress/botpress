import * as sdk from '@botpress/sdk'
import { z } from '@botpress/sdk'

const metadata = z.record(z.any()).optional()
const text = { schema: sdk.messages.defaults.text.schema.extend({ metadata }) }
const image = { schema: sdk.messages.defaults.image.schema.extend({ metadata }) }
const audio = { schema: sdk.messages.defaults.audio.schema.extend({ metadata }) }
const video = { schema: sdk.messages.defaults.video.schema.extend({ metadata }) }
const file = { schema: sdk.messages.defaults.file.schema.extend({ metadata }) }
const location = { schema: sdk.messages.defaults.location.schema.extend({ metadata }) }
const carousel = { schema: sdk.messages.defaults.carousel.schema.extend({ metadata }) }
const card = { schema: sdk.messages.defaults.card.schema.extend({ metadata }) }
const dropdown = { schema: sdk.messages.defaults.dropdown.schema.extend({ metadata }) }
const choice = { schema: sdk.messages.defaults.choice.schema.extend({ metadata }) }
const markdown = { schema: sdk.messages.markdown.schema.extend({ metadata }) }

const blocSchema = z.union([
  z.object({ type: z.literal('text'), payload: text.schema }),
  z.object({ type: z.literal('markdown'), payload: markdown.schema }),
  z.object({ type: z.literal('image'), payload: image.schema }),
  z.object({ type: z.literal('audio'), payload: audio.schema }),
  z.object({ type: z.literal('video'), payload: video.schema }),
  z.object({ type: z.literal('file'), payload: file.schema }),
  z.object({ type: z.literal('location'), payload: location.schema }),
])

const blocsSchema = z.object({
  items: z.array(blocSchema),
  metadata,
})

export const messages = {
  text,
  image,
  audio,
  video,
  file,
  location,
  carousel,
  card,
  dropdown,
  choice,
  bloc: { schema: blocsSchema },
  markdown,
} satisfies sdk.ChannelDefinition['messages']
