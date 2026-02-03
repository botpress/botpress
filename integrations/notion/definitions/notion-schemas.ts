import { z } from '@botpress/sdk'

const richText = z
  .object({
    text: z.object({ content: z.string() }),
    type: z.literal('text').optional(),
  })
  .passthrough()

const titleProp = z.object({ type: z.literal('title'), title: z.array(richText) })
const richTextProp = z.object({ rich_text: z.array(richText) })
const numberProp = z.object({ number: z.number().nullable() })
const checkboxProp = z.object({ checkbox: z.boolean() })
const selectProp = z.object({ select: z.object({ name: z.string() }).nullable() })
const statusProp = z.object({ status: z.object({ name: z.string() }).nullable() })
const multiSelectProp = z.object({ multi_select: z.array(z.object({ name: z.string() })) })
const dateProp = z.object({
  date: z
    .object({
      start: z.string(),
      end: z.string().optional().nullable(),
    })
    .nullable(),
})
const urlProp = z.object({ url: z.string().nullable() })
const emailProp = z.object({ email: z.string().nullable() })
const phoneProp = z.object({ phone_number: z.string().nullable() })
const peopleProp = z.object({ people: z.array(z.object({ id: z.string() })) })
const relationProp = z.object({ relation: z.array(z.object({ id: z.string() })) })
const filesProp = z.object({
  files: z.array(
    z.union([
      z.object({
        external: z.object({ url: z.string() }),
        name: z.string(),
        type: z.literal('external').optional(),
      }),
      z.object({
        file: z.object({ url: z.string(), expiry_time: z.string().optional() }),
        name: z.string(),
        type: z.literal('file').optional(),
      }),
    ])
  ),
})

export const updatePagePropertiesSchema = z.record(
  z.union([
    titleProp,
    richTextProp,
    numberProp,
    checkboxProp,
    selectProp,
    statusProp,
    multiSelectProp,
    dateProp,
    urlProp,
    emailProp,
    phoneProp,
    peopleProp,
    relationProp,
    filesProp,
  ])
)
