import z from 'zod'

export const targets = z.object({
  dm: z.record(z.string()).optional(),
  channel: z.record(z.string()).optional(),
  thread: z.record(z.string()).optional(),
})

const plainTextSchema = z.object({ type: z.literal('plain_text'), text: z.string() })
const markdownSchema = z.object({ type: z.literal('mrkdwn'), text: z.string() })

const imageSchema = z
  .object({
    type: z.literal('image'),
    image_url: z.string().describe('The full URL to the image file'),
    alt_text: z.string().describe('Plain text summary of the image'),
  })
  .describe('Display an image to a user')

const buttonSchema = z
  .object({
    type: z.literal('button'),
    action_id: z.string().optional().describe('A unique identifier for the button'),
    text: plainTextSchema,
    url: z.string().optional().describe('An external URL to open when the button is clicked'),
  })
  .describe('Button Block. Display a button')

const selectSchema = z
  .object({
    type: z.literal('static_select'),
    placeholder: plainTextSchema,
    action_id: z.string(),
    options: z.array(
      z.object({
        text: plainTextSchema,
        value: z.string(),
      })
    ),
  })
  .strict()

const actionsSchema = z
  .object({
    type: z.literal('actions'),
    elements: z.array(z.discriminatedUnion('type', [imageSchema, selectSchema, buttonSchema])),
  })
  .strict()
  .describe('Display multiple elements in a group')

const contextSchema = z
  .object({
    type: z.literal('context'),
    elements: z.array(z.discriminatedUnion('type', [imageSchema, plainTextSchema, markdownSchema])),
  })
  .strict()
  .describe('Display multiple elements in a group')

const sectionSchema = z
  .object({
    type: z.literal('section'),
    text: z.object({
      type: z.union([z.literal('mrkdwn'), z.literal('plain_text')]),
      text: z.string(),
    }),
    accessory: z.discriminatedUnion('type', [imageSchema, buttonSchema, selectSchema]).optional(),
  })
  .strict()
  .describe('Show a message using markdown')

const dividerSchema = z.object({ type: z.literal('divider') }).describe('A simple divider block')

const headerSchema = z
  .object({
    type: z.literal('header'),
    text: plainTextSchema,
  })
  .describe('A simple header block')

const fileSchema = z
  .object({
    type: z.literal('file'),
    external_id: z.string(),
    source: z.literal('remote'),
  })
  .describe('A file block')

const radioButtonsSchema = z
  .object({
    type: z.literal('radio_buttons'),
    options: z.array(
      z.object({
        text: plainTextSchema,
        value: z.string(),
      })
    ),
    action_id: z.string(),
  })
  .describe('A radio buttons block')

const checkboxesSchema = z
  .object({
    type: z.literal('checkboxes'),
    options: z.array(
      z.object({
        text: plainTextSchema,
        value: z.string(),
      })
    ),
    action_id: z.string(),
  })
  .describe('A checkboxes block')

const overflowSchema = z
  .object({
    type: z.literal('overflow'),
    options: z.array(
      z.object({
        text: markdownSchema,
        value: z.string(),
      })
    ),
    action_id: z.string(),
  })
  .describe('An overflow block')

const datePickerSchema = z
  .object({
    type: z.literal('datepicker'),
    action_id: z.string(),
    placeholder: markdownSchema.optional(),
    initial_date: z.string().optional(),
  })
  .describe('A date picker block')

const timePickerSchema = z
  .object({
    type: z.literal('timepicker'),
    action_id: z.string(),
    placeholder: markdownSchema.optional(),
    initial_time: z.string().optional(),
  })
  .describe('A time picker block')

const optionSchema = z.object({
  text: plainTextSchema,
  value: z.string(),
})

const optionGroupSchema = z.object({
  label: plainTextSchema,
  options: z.array(optionSchema),
})

const multiSelectMenuSchema = z
  .object({
    type: z.literal('multi_static_select'),
    placeholder: plainTextSchema,
    action_id: z.string(),
    options: z.array(optionSchema).optional(),
    option_groups: z.array(optionGroupSchema).optional(),
  })
  .describe('A multi-select menu block')

const conversationsSelectMenuSchema = z
  .object({
    type: z.literal('conversations_select'),
    placeholder: plainTextSchema,
    action_id: z.string(),
  })
  .describe('A conversations select menu block')

const channelsSelectMenuSchema = z
  .object({
    type: z.literal('channels_select'),
    placeholder: plainTextSchema,
    action_id: z.string(),
  })
  .describe('A channels select menu block')

const usersSelectMenuSchema = z
  .object({
    type: z.literal('users_select'),
    placeholder: plainTextSchema,
    action_id: z.string(),
  })
  .describe('A users select menu block')

const externalSelectMenuSchema = z
  .object({
    type: z.literal('external_select'),
    placeholder: plainTextSchema,
    action_id: z.string(),
  })
  .describe('An external select menu block')

const conversationsMultiSelectMenuSchema = z
  .object({
    type: z.literal('conversations_multi_select'),
    placeholder: plainTextSchema,
    action_id: z.string(),
  })
  .describe('A conversations multi-select menu block')

const channelsMultiSelectMenuSchema = z
  .object({
    type: z.literal('channels_multi_select'),
    placeholder: plainTextSchema,
    action_id: z.string(),
  })
  .describe('A channels multi-select menu block')

const usersMultiSelectMenuSchema = z
  .object({
    type: z.literal('users_multi_select'),
    placeholder: plainTextSchema,
    action_id: z.string(),
  })
  .describe('A users multi-select menu block')

const externalMultiSelectMenuSchema = z
  .object({
    type: z.literal('external_multi_select'),
    placeholder: plainTextSchema,
    action_id: z.string(),
  })
  .describe('An external multi-select menu block')

const inputSchema = z
  .object({
    type: z.literal('input'),
    label: plainTextSchema,
    element: z.discriminatedUnion('type', [
      selectSchema,
      multiSelectMenuSchema,
      conversationsSelectMenuSchema,
      channelsSelectMenuSchema,
      usersSelectMenuSchema,
      externalSelectMenuSchema,
      conversationsMultiSelectMenuSchema,
      channelsMultiSelectMenuSchema,
      usersMultiSelectMenuSchema,
      externalMultiSelectMenuSchema,
      buttonSchema,
      overflowSchema,
      datePickerSchema,
      timePickerSchema,
      checkboxesSchema,
      radioButtonsSchema,
      plainTextSchema,
      markdownSchema,
    ]),
    block_id: z.string().optional(),
  })
  .describe('An input block')

export const textSchema = z
  .object({
    text: z
      .string()
      .describe(
        'Field text must be defined but it is ignored if blocks are provided. In this situation, the text must be provided in the blocks array'
      ),
    blocks: z
      .array(
        z.discriminatedUnion('type', [
          sectionSchema,
          imageSchema,
          selectSchema,
          actionsSchema,
          contextSchema,
          dividerSchema,
          headerSchema,
          fileSchema,
          inputSchema,
          radioButtonsSchema,
          checkboxesSchema,
          overflowSchema,
          datePickerSchema,
          timePickerSchema,
          multiSelectMenuSchema,
          conversationsSelectMenuSchema,
          channelsSelectMenuSchema,
          usersSelectMenuSchema,
          externalSelectMenuSchema,
          conversationsMultiSelectMenuSchema,
          channelsMultiSelectMenuSchema,
          usersMultiSelectMenuSchema,
          externalMultiSelectMenuSchema,
        ])
      )
      .optional()
      .describe(
        'Multiple blocks can be added to this array. If a block is provided, the text field is ignored and the text must be added as a block'
      ),
  })
  .strict()
