import { z } from '@botpress/sdk'
import { UpdatePageParameters } from '@notionhq/client/build/src/api-endpoints'

const richText = z.object({
  type: z.literal('text'),
  text: z.object({ content: z.string(), link: z.object({ url: z.string() }).optional() }),
  annotations: z.any().optional(),
  plain_text: z.string().optional(),
  href: z.string().nullable().optional(),
})

const titleProp = z.object({ title: z.array(richText) })
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
      time_zone: z.string().optional().nullable(),
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
        type: z.literal('external'),
        name: z.string().optional(),
        external: z.object({ url: z.string() }),
      }),
      z.object({
        type: z.literal('file'),
        name: z.string().optional(),
        file: z.object({ url: z.string(), expiry_time: z.string().optional() }).optional(),
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