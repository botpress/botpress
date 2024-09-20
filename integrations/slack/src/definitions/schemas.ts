import { z } from '@botpress/sdk'

const plainTextSchema = z.object({ type: z.literal('plain_text'), text: z.string() }).strict()
const markdownSchema = z.object({ type: z.literal('mrkdwn'), text: z.string() }).strict()
const plainOrMarkdown = z.discriminatedUnion('type', [markdownSchema, plainTextSchema])

const imageElement = z
  .object({
    type: z.literal('image'),
    image_url: z.string().describe('The full URL to the image file'),
    alt_text: z.string().describe('Plain text summary of the image'),
  })
  .strict()
  .describe('Display an image to a user')

const imageBlock = z
  .object({
    type: z.literal('image'),
    image_url: z.string().describe('The full URL to the image file'),
    alt_text: z.string().describe('Plain text summary of the image'),
    title: plainTextSchema.optional(),
  })
  .strict()
  .describe('Display an image to a user')

const buttonSchema = z
  .object({
    type: z.literal('button'),
    action_id: z.string().describe('A unique identifier for the button'),
    text: plainTextSchema,
    url: z.string().optional().describe('An external URL to open when the button is clicked'),
    value: z.string().optional().describe('The value to send along with the interaction payload'),
    style: z
      .enum(['primary', 'danger'])
      .optional()
      .describe('Decorates buttons with alternative visual color schemes. Leave empty for default.'),
  })
  .strict()
  .describe('Button Block. Display a button')

const staticSelectSchema = z
  .object({
    type: z.literal('static_select'),
    placeholder: plainTextSchema,
    action_id: z.string(),
    options: z.array(
      z
        .object({
          text: plainTextSchema,
          value: z.string(),
        })
        .strict()
    ),
  })
  .strict()

const contextBlock = z
  .object({
    type: z.literal('context'),
    elements: z.array(z.discriminatedUnion('type', [imageElement, ...plainOrMarkdown.options])).max(10),
  })
  .strict()
  .describe('Display multiple elements in a group')

const dividerBlock = z.object({ type: z.literal('divider') }).describe('A simple divider block')

const headerBlock = z
  .object({
    type: z.literal('header'),
    text: plainTextSchema,
  })
  .strict()
  .describe(
    'A header is a plain-text block that displays in a larger, bold font. Use it to delineate between different groups of content in your app surface'
  )

const fileBlock = z
  .object({
    type: z.literal('file'),
    external_id: z.string(),
    source: z.literal('remote'),
  })
  .strict()
  .describe('A file block')

const radioButtonsSchema = z
  .object({
    type: z.literal('radio_buttons'),
    options: z.array(
      z
        .object({
          text: plainTextSchema,
          value: z.string(),
        })
        .strict()
    ),
    action_id: z.string(),
  })
  .strict()
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
  .strict()
  .describe('A checkboxes block')

const overflowSchema = z
  .object({
    type: z.literal('overflow'),
    options: z
      .array(
        z
          .object({
            text: plainTextSchema,
            value: z.string().max(75),
            description: plainTextSchema.optional(),
            url: z
              .string()
              .optional()
              .describe(
                "A URL to load in the user's browser when the option is clicked. The url attribute is only available in overflow menus."
              ),
          })
          .strict()
      )
      .max(5),
    action_id: z.string(),
  })
  .strict()
  .describe('An overflow block')

const actionId = z
  .string()
  .max(255)
  .describe(
    'An identifier for the input value when the parent modal is submitted. You can use this when you receive a view_submission payload to identify the value of the input element. Should be unique among all other action_ids in the containing block. '
  )

const datePickerSchema = z
  .object({
    type: z.literal('datepicker'),
    action_id: actionId,
    placeholder: plainTextSchema.optional(),
    initial_date: z.string().optional(),
  })
  .strict()
  .describe('A date picker block')

const dateTimePickerSchema = z
  .object({
    type: z.literal('datetimepicker'),
    action_id: actionId,
    initial_date_time: z
      .number()
      .describe(
        'The initial date and time that is selected when the element is loaded, represented as a UNUIX timestamp in seconds. This should be in the format of 10 digits, for example 1628633820 represents the date and time August 10th, 2021 at 03:17pm PST'
      )
      .optional(),
    // confirm: // TODO:
    focus_on_load: z.boolean().optional(),
  })
  .strict()
  .describe('A date picker block')

const timePickerSchema = z
  .object({
    type: z.literal('timepicker'),
    action_id: actionId,
    placeholder: plainTextSchema.optional(),
    initial_time: z.string().optional(),
  })
  .strict()
  .describe('A time picker block')

const optionSchema = z
  .object({
    text: plainTextSchema,
    value: z.string(),
  })
  .strict()

const optionGroupSchema = z
  .object({
    label: plainTextSchema,
    options: z.array(optionSchema),
  })
  .strict()

const multiSelectStaticMenuSchema = z
  .object({
    type: z.literal('multi_static_select'),
    placeholder: plainTextSchema,
    action_id: z.string(),
    options: z.array(optionSchema).optional(),
    option_groups: z.array(optionGroupSchema).optional(),
  })
  .strict()
  .refine((obj) => !!obj.options || !!obj.option_groups, {
    message: 'At least one of options or option_groups must be provided',
  })
  .describe('A multi-select menu block')

const conversationsSelectMenuSchema = z
  .object({
    type: z.literal('conversations_select'),
    placeholder: plainTextSchema,
    action_id: z.string(),
  })
  .strict()
  .describe('A conversations select menu block')

const channelsSelectMenuSchema = z
  .object({
    type: z.literal('channels_select'),
    placeholder: plainTextSchema,
    action_id: z.string(),
  })
  .strict()
  .describe('A channels select menu block')

const usersSelectMenuSchema = z
  .object({
    type: z.literal('users_select'),
    placeholder: plainTextSchema,
    action_id: z.string(),
  })
  .strict()
  .describe('A users select menu block')

const externalSelectMenuSchema = z
  .object({
    type: z.literal('external_select'),
    placeholder: plainTextSchema,
    action_id: z.string(),
  })
  .strict()
  .describe('An external select menu block')

const conversationsMultiSelectMenuSchema = z
  .object({
    type: z.literal('conversations_multi_select'),
    placeholder: plainTextSchema,
    action_id: z.string(),
  })
  .strict()
  .describe('A conversations multi-select menu block')

const channelsMultiSelectMenuSchema = z
  .object({
    type: z.literal('channels_multi_select'),
    placeholder: plainTextSchema,
    action_id: z.string(),
  })
  .strict()
  .describe('A channels multi-select menu block')

const usersMultiSelectMenuSchema = z
  .object({
    type: z.literal('users_multi_select'),
    placeholder: plainTextSchema,
    action_id: z.string(),
  })
  .strict()
  .describe('A users multi-select menu block')

const externalMultiSelectMenuSchema = z
  .object({
    type: z.literal('external_multi_select'),
    placeholder: plainTextSchema,
    action_id: z.string(),
  })
  .strict()
  .describe('An external multi-select menu block')

const plainTextInput = z
  .object({
    type: z.literal('plain_text_input'),
    action_id: z
      .string()
      .max(255)
      .describe(
        'An identifier for the input value when the parent modal is submitted. You can use this when you receive a view_submission payload to identify the value of the input element. Should be unique among all other action_ids in the containing block.'
      ),
    initial_value: z.string().describe('The initial value in the plain-text input when it is loaded.').optional(),
    multiline: z
      .boolean()
      .optional()
      .describe('Indicates whether the input will be a single line (false) or a larger textarea (true'),
    min_length: z.number().min(0).max(3000).optional(),
    max_length: z.number().min(0).max(3000).optional(),
    focus_on_load: z.boolean().optional(),
    placeholder: plainTextSchema.optional(),
    // TODO: dispatch_action_config
  })
  .strict()

const multiSelectMenus = z.discriminatedUnion('type', [
  multiSelectStaticMenuSchema.sourceType(),
  externalMultiSelectMenuSchema,
  usersMultiSelectMenuSchema,
  conversationsMultiSelectMenuSchema,
  channelsMultiSelectMenuSchema,
])

const selectMenus = z.discriminatedUnion('type', [
  staticSelectSchema,
  externalSelectMenuSchema,
  usersSelectMenuSchema,
  conversationsSelectMenuSchema,
  channelsSelectMenuSchema,
])

const inputBlock = z
  .object({
    type: z.literal('input'),
    label: plainTextSchema,
    element: z.discriminatedUnion('type', [
      plainTextInput,
      checkboxesSchema,
      radioButtonsSchema,
      ...selectMenus.options,
      ...multiSelectMenus.options,
      datePickerSchema,
    ]),
    dispatch_action: z.boolean().optional(),
    block_id: z.string().max(255).optional(),
    hint: plainTextSchema.optional(),
    optional: z.boolean().optional(),
  })

  .strict()
  .describe('An input block')

const sectionSchema = z
  .object({
    type: z.literal('section'),
    text: plainOrMarkdown.optional(),
    fields: z.array(plainOrMarkdown).min(1).max(10).optional(),
    accessory: z
      .discriminatedUnion('type', [
        buttonSchema,
        checkboxesSchema,
        datePickerSchema,
        imageElement,
        overflowSchema,
        radioButtonsSchema,
        ...multiSelectMenus.options,
        ...selectMenus.options,
        timePickerSchema,
      ])
      .optional(),
  })
  .strict()
  .describe('Show a message using markdown')

const actionsBlock = z
  .object({
    type: z.literal('actions'),
    elements: z
      .array(
        z.discriminatedUnion('type', [
          buttonSchema,
          checkboxesSchema,
          datePickerSchema,
          dateTimePickerSchema,
          overflowSchema,
          radioButtonsSchema,
          ...selectMenus.options,
          timePickerSchema,
        ])
      )
      .max(5),
  })
  .describe('Display multiple elements in a group')
  .strict()

const blocks = z.discriminatedUnion('type', [
  actionsBlock,
  contextBlock,
  dividerBlock,
  fileBlock,
  headerBlock,
  imageBlock,
  inputBlock,
  sectionSchema,
  // video // TODO:
])

export const textSchema = z
  .object({
    text: z
      .string()
      .describe(
        'Field text must be defined but it is ignored if blocks are provided. In this situation, the text must be provided in the blocks array'
      )
      .optional(),
    blocks: z
      .array(blocks)
      .max(50)
      .optional()
      .describe(
        'Multiple blocks can be added to this array. If a block is provided, the text field is ignored and the text must be added as a block'
      ),
  })
  .strict()
