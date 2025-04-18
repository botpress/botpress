import * as sdk from '@botpress/sdk'

const plainTextSchema = sdk.z.object({ type: sdk.z.literal('plain_text'), text: sdk.z.string() }).strict()
const markdownSchema = sdk.z.object({ type: sdk.z.literal('mrkdwn'), text: sdk.z.string() }).strict()
const plainOrMarkdown = sdk.z.discriminatedUnion('type', [markdownSchema, plainTextSchema])

const imageElement = sdk.z
  .object({
    type: sdk.z.literal('image'),
    image_url: sdk.z.string().describe('The full URL to the image file'),
    alt_text: sdk.z.string().describe('Plain text summary of the image'),
  })
  .strict()
  .describe('Display an image to a user')

const imageBlock = sdk.z
  .object({
    type: sdk.z.literal('image'),
    image_url: sdk.z.string().describe('The full URL to the image file'),
    alt_text: sdk.z.string().describe('Plain text summary of the image'),
    title: plainTextSchema.optional(),
  })
  .strict()
  .describe('Display an image to a user')

const buttonSchema = sdk.z
  .object({
    type: sdk.z.literal('button'),
    action_id: sdk.z.string().describe('A unique identifier for the button'),
    text: plainTextSchema,
    url: sdk.z.string().optional().describe('An external URL to open when the button is clicked'),
    value: sdk.z.string().optional().describe('The value to send along with the interaction payload'),
    style: sdk.z
      .enum(['primary', 'danger'])
      .optional()
      .describe('Decorates buttons with alternative visual color schemes. Leave empty for default.'),
  })
  .strict()
  .describe('Button Block. Display a button')

const staticSelectSchema = sdk.z
  .object({
    type: sdk.z.literal('static_select'),
    placeholder: plainTextSchema,
    action_id: sdk.z.string(),
    options: sdk.z.array(
      sdk.z
        .object({
          text: plainTextSchema,
          value: sdk.z.string(),
        })
        .strict()
    ),
  })
  .strict()

const contextBlock = sdk.z
  .object({
    type: sdk.z.literal('context'),
    elements: sdk.z.array(sdk.z.discriminatedUnion('type', [imageElement, ...plainOrMarkdown.options])).max(10),
  })
  .strict()
  .describe('Display multiple elements in a group')

const dividerBlock = sdk.z.object({ type: sdk.z.literal('divider') }).describe('A simple divider block')

const headerBlock = sdk.z
  .object({
    type: sdk.z.literal('header'),
    text: plainTextSchema,
  })
  .strict()
  .describe(
    'A header is a plain-text block that displays in a larger, bold font. Use it to delineate between different groups of content in your app surface'
  )

const fileBlock = sdk.z
  .object({
    type: sdk.z.literal('file'),
    external_id: sdk.z.string(),
    source: sdk.z.literal('remote'),
  })
  .strict()
  .describe('A file block')

const radioButtonsSchema = sdk.z
  .object({
    type: sdk.z.literal('radio_buttons'),
    options: sdk.z.array(
      sdk.z
        .object({
          text: plainTextSchema,
          value: sdk.z.string(),
        })
        .strict()
    ),
    action_id: sdk.z.string(),
  })
  .strict()
  .describe('A radio buttons block')

const checkboxesSchema = sdk.z
  .object({
    type: sdk.z.literal('checkboxes'),
    options: sdk.z.array(
      sdk.z.object({
        text: plainTextSchema,
        value: sdk.z.string(),
      })
    ),
    action_id: sdk.z.string(),
  })
  .strict()
  .describe('A checkboxes block')

const overflowSchema = sdk.z
  .object({
    type: sdk.z.literal('overflow'),
    options: sdk.z
      .array(
        sdk.z
          .object({
            text: plainTextSchema,
            value: sdk.z.string().max(75),
            description: plainTextSchema.optional(),
            url: sdk.z
              .string()
              .optional()
              .describe(
                "A URL to load in the user's browser when the option is clicked. The url attribute is only available in overflow menus."
              ),
          })
          .strict()
      )
      .max(5),
    action_id: sdk.z.string(),
  })
  .strict()
  .describe('An overflow block')

const actionId = sdk.z
  .string()
  .max(255)
  .describe(
    'An identifier for the input value when the parent modal is submitted. You can use this when you receive a view_submission payload to identify the value of the input element. Should be unique among all other action_ids in the containing block. '
  )

const datePickerSchema = sdk.z
  .object({
    type: sdk.z.literal('datepicker'),
    action_id: actionId,
    placeholder: plainTextSchema.optional(),
    initial_date: sdk.z.string().optional(),
  })
  .strict()
  .describe('A date picker block')

const dateTimePickerSchema = sdk.z
  .object({
    type: sdk.z.literal('datetimepicker'),
    action_id: actionId,
    initial_date_time: sdk.z
      .number()
      .describe(
        'The initial date and time that is selected when the element is loaded, represented as a UNUIX timestamp in seconds. This should be in the format of 10 digits, for example 1628633820 represents the date and time August 10th, 2021 at 03:17pm PST'
      )
      .optional(),
    // confirm: // TODO:
    focus_on_load: sdk.z.boolean().optional(),
  })
  .strict()
  .describe('A date picker block')

const timePickerSchema = sdk.z
  .object({
    type: sdk.z.literal('timepicker'),
    action_id: actionId,
    placeholder: plainTextSchema.optional(),
    initial_time: sdk.z.string().optional(),
  })
  .strict()
  .describe('A time picker block')

const optionSchema = sdk.z
  .object({
    text: plainTextSchema,
    value: sdk.z.string(),
  })
  .strict()

const optionGroupSchema = sdk.z
  .object({
    label: plainTextSchema,
    options: sdk.z.array(optionSchema),
  })
  .strict()

const multiSelectStaticMenuSchema = sdk.z
  .object({
    type: sdk.z.literal('multi_static_select'),
    placeholder: plainTextSchema,
    action_id: sdk.z.string(),
    options: sdk.z.array(optionSchema).optional(),
    option_groups: sdk.z.array(optionGroupSchema).optional(),
  })
  .strict()
  .refine((obj) => !!obj.options || !!obj.option_groups, {
    message: 'At least one of options or option_groups must be provided',
  })
  .describe('A multi-select menu block')

const conversationsSelectMenuSchema = sdk.z
  .object({
    type: sdk.z.literal('conversations_select'),
    placeholder: plainTextSchema,
    action_id: sdk.z.string(),
  })
  .strict()
  .describe('A conversations select menu block')

const channelsSelectMenuSchema = sdk.z
  .object({
    type: sdk.z.literal('channels_select'),
    placeholder: plainTextSchema,
    action_id: sdk.z.string(),
  })
  .strict()
  .describe('A channels select menu block')

const usersSelectMenuSchema = sdk.z
  .object({
    type: sdk.z.literal('users_select'),
    placeholder: plainTextSchema,
    action_id: sdk.z.string(),
  })
  .strict()
  .describe('A users select menu block')

const externalSelectMenuSchema = sdk.z
  .object({
    type: sdk.z.literal('external_select'),
    placeholder: plainTextSchema,
    action_id: sdk.z.string(),
  })
  .strict()
  .describe('An external select menu block')

const conversationsMultiSelectMenuSchema = sdk.z
  .object({
    type: sdk.z.literal('conversations_multi_select'),
    placeholder: plainTextSchema,
    action_id: sdk.z.string(),
  })
  .strict()
  .describe('A conversations multi-select menu block')

const channelsMultiSelectMenuSchema = sdk.z
  .object({
    type: sdk.z.literal('channels_multi_select'),
    placeholder: plainTextSchema,
    action_id: sdk.z.string(),
  })
  .strict()
  .describe('A channels multi-select menu block')

const usersMultiSelectMenuSchema = sdk.z
  .object({
    type: sdk.z.literal('users_multi_select'),
    placeholder: plainTextSchema,
    action_id: sdk.z.string(),
  })
  .strict()
  .describe('A users multi-select menu block')

const externalMultiSelectMenuSchema = sdk.z
  .object({
    type: sdk.z.literal('external_multi_select'),
    placeholder: plainTextSchema,
    action_id: sdk.z.string(),
  })
  .strict()
  .describe('An external multi-select menu block')

const plainTextInput = sdk.z
  .object({
    type: sdk.z.literal('plain_text_input'),
    action_id: sdk.z
      .string()
      .max(255)
      .describe(
        'An identifier for the input value when the parent modal is submitted. You can use this when you receive a view_submission payload to identify the value of the input element. Should be unique among all other action_ids in the containing block.'
      ),
    initial_value: sdk.z.string().describe('The initial value in the plain-text input when it is loaded.').optional(),
    multiline: sdk.z
      .boolean()
      .optional()
      .describe('Indicates whether the input will be a single line (false) or a larger textarea (true'),
    min_length: sdk.z.number().min(0).max(3000).optional(),
    max_length: sdk.z.number().min(0).max(3000).optional(),
    focus_on_load: sdk.z.boolean().optional(),
    placeholder: plainTextSchema.optional(),
    // TODO: dispatch_action_config
  })
  .strict()

const multiSelectMenus = sdk.z.discriminatedUnion('type', [
  multiSelectStaticMenuSchema.sourceType(),
  externalMultiSelectMenuSchema,
  usersMultiSelectMenuSchema,
  conversationsMultiSelectMenuSchema,
  channelsMultiSelectMenuSchema,
])

const selectMenus = sdk.z.discriminatedUnion('type', [
  staticSelectSchema,
  externalSelectMenuSchema,
  usersSelectMenuSchema,
  conversationsSelectMenuSchema,
  channelsSelectMenuSchema,
])

const inputBlock = sdk.z
  .object({
    type: sdk.z.literal('input'),
    label: plainTextSchema,
    element: sdk.z.discriminatedUnion('type', [
      plainTextInput,
      checkboxesSchema,
      radioButtonsSchema,
      ...selectMenus.options,
      ...multiSelectMenus.options,
      datePickerSchema,
    ]),
    dispatch_action: sdk.z.boolean().optional(),
    block_id: sdk.z.string().max(255).optional(),
    hint: plainTextSchema.optional(),
    optional: sdk.z.boolean().optional(),
  })

  .strict()
  .describe('An input block')

const sectionSchema = sdk.z
  .object({
    type: sdk.z.literal('section'),
    text: plainOrMarkdown.optional(),
    fields: sdk.z.array(plainOrMarkdown).min(1).max(10).optional(),
    accessory: sdk.z
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

const actionsBlock = sdk.z
  .object({
    type: sdk.z.literal('actions'),
    elements: sdk.z
      .array(
        sdk.z.discriminatedUnion('type', [
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

const blocks = sdk.z.discriminatedUnion('type', [
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

export const textSchema = sdk.z
  .object({
    text: sdk.z
      .string()
      .describe(
        'Field text must be defined but it is ignored if blocks are provided. In this situation, the text must be provided in the blocks array'
      )
      .optional(),
    blocks: sdk.z
      .array(blocks)
      .max(50)
      .optional()
      .describe(
        'Multiple blocks can be added to this array. If a block is provided, the text field is ignored and the text must be added as a block'
      ),
  })
  .strict()
