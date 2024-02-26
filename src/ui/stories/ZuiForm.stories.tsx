import type { Meta, StoryObj } from '@storybook/react'
import { UIComponentDefinitions, ZuiComponentMap } from '../types'
import { Zui, zui as zuiImport } from '../../index'
import { ZuiForm } from '..'
import { z } from 'zod'

const zui = zuiImport as Zui<typeof exampleExtensions>

const commonInputSchema = z.object({})

const exampleExtensions = {
  string: {
    textbox: {
      id: 'textbox',
      schema: commonInputSchema.extend({
        multiline: z.boolean().default(false).optional(),
        fitContentWidth: z.boolean().default(false).optional(),
      }),
    },
    datetimeinput: {
      id: 'datetimeinput',
      schema: commonInputSchema.extend({
        type: z.enum(['time', 'date', 'date-time']).default('date-time'),
      }),
    },
  },
  number: {
    numberinput: {
      id: 'numberinput',
      schema: commonInputSchema,
    },
    slider: {
      id: 'slider',
      schema: commonInputSchema,
    },
  },
  boolean: {
    checkbox: {
      id: 'checkbox',
      schema: commonInputSchema.extend({
        toggle: z.boolean().default(false).optional(),
      }),
    },
  },
  array: {},
  object: {
    verticalLayout: {
      id: 'verticalLayout',
      schema: z.object({}),
    },
    horizontalLayout: {
      id: 'horizontalLayout',
      schema: z.object({}),
    },
  },
} satisfies UIComponentDefinitions

const exampleSchema = zui
  .object({
    firstName: zui.string().title('User').disabled().hidden().placeholder('Enter your name').tooltip('yo').nullable(),

    lastName: zui
      .string()
      .min(3)
      .displayAs('textbox', {
        fitContentWidth: true,
        multiline: true,
      })
      .title('Last Name')
      .nullable(),
    dates: zui
      .array(
        zui
          .string()
          .displayAs('datetimeinput', {
            type: 'date',
          })
          .title('Date'),
      )
      .nonempty(),
    // tests the hidden function
    arandomfield: zui.string().hidden(),
    arandomnumber: zui.number().hidden(),
    arandomboolean: zui.boolean().hidden(),

    birthday: zui
      .string()
      .displayAs('datetimeinput', {
        type: 'date',
        yo: 'bero',
        yes: 'it works!',
      } as any)
      .title('Date of Birth'),
    plan: zui.enum(['basic', 'premium']).displayAs('textbox', {}).hidden(),
    age: zui.number().displayAs('numberinput', {}),
    email: zui.string().displayAs('textbox', {}).title('Email Address'),
    password: zui.string().displayAs('textbox', {}),
    passwordConfirm: zui.string().displayAs('textbox', {}),
  })
  .displayAs('horizontalLayout', {})
  .title('User Information')

const componentMap: ZuiComponentMap<typeof exampleExtensions> = {
  string: {
    datetimeinput: () => null,
    textbox: ({ onChange, errors, required, label, data, zuiProps }) => (
      <div style={{ padding: '1rem' }}>
        <span>{label}</span>
        <input placeholder={zuiProps?.placeholder} onChange={(e) => onChange(e.target.value)} />
        {required && <span>*</span>}
        {errors && typeof data !== 'undefined' && <span style={{ color: 'red' }}>{errors}</span>}
      </div>
    ),
    default: () => null,
  },
  array: {
    default: () => null,
  },
  boolean: {
    checkbox: () => null,
    default: () => null,
  },
  number: {
    default: () => null,
    numberinput: () => null,
    slider: () => null,
  },
  object: {
    default: ({ children }) => <div>{children}</div>,
    verticalLayout: () => null,
    horizontalLayout: ({ zuiProps, children }) => (
      <div>
        <h1>{zuiProps.title}</h1>
        <div>{children}</div>
      </div>
    ),
  },
}

const meta = {
  title: 'Form/Example',
  component: ZuiForm<typeof exampleExtensions>,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ZuiForm<typeof exampleExtensions>>

type Story = StoryObj<typeof meta>

export const ExampleSchema: Story = {
  args: {
    schema: exampleSchema.toJsonSchema({
      target: 'openApi3',
    }),
    components: componentMap,
  },
}

export default meta
