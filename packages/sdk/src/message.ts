import { z } from './zui'

const NonEmptyString = z.string().min(1)

const textMessageSchema = z.object({
  text: NonEmptyString,
})

const markdownMessageSchema = z.object({
  markdown: NonEmptyString,
})

const imageMessageSchema = z.object({
  imageUrl: NonEmptyString,
})

const audioMessageSchema = z.object({
  audioUrl: NonEmptyString,
})

const videoMessageSchema = z.object({
  videoUrl: NonEmptyString,
})

const fileMessageSchema = z.object({
  fileUrl: NonEmptyString,
  title: NonEmptyString.optional(),
})

const locationMessageSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().optional(),
  title: z.string().optional(),
})

const cardSchema = z.object({
  title: NonEmptyString,
  subtitle: NonEmptyString.optional(),
  imageUrl: NonEmptyString.optional(),
  actions: z.array(
    z.object({
      action: z.enum(['postback', 'url', 'say']),
      label: NonEmptyString,
      value: NonEmptyString,
    })
  ),
})

const choiceSchema = z.object({
  text: NonEmptyString,
  options: z.array(
    z.object({
      label: NonEmptyString,
      value: NonEmptyString,
    })
  ),
})

const carouselSchema = z.object({
  items: z.array(cardSchema),
})

const blocSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), payload: textMessageSchema }),
  z.object({ type: z.literal('markdown'), payload: markdownMessageSchema }),
  z.object({ type: z.literal('image'), payload: imageMessageSchema }),
  z.object({ type: z.literal('audio'), payload: audioMessageSchema }),
  z.object({ type: z.literal('video'), payload: videoMessageSchema }),
  z.object({ type: z.literal('file'), payload: fileMessageSchema }),
  z.object({ type: z.literal('location'), payload: locationMessageSchema }),
])

const blocsSchema = z.object({
  items: z.array(blocSchema),
})

export const defaults = {
  text: { schema: textMessageSchema },
  markdown: { schema: markdownMessageSchema },
  image: { schema: imageMessageSchema },
  audio: { schema: audioMessageSchema },
  video: { schema: videoMessageSchema },
  file: { schema: fileMessageSchema },
  location: { schema: locationMessageSchema },
  carousel: { schema: carouselSchema },
  card: { schema: cardSchema },
  dropdown: { schema: choiceSchema },
  choice: { schema: choiceSchema },
  bloc: { schema: blocsSchema },
} as const // should use satisfies operator but this works for older versions of TS
