import type { Meta, StoryObj } from '@storybook/react'
import { defaultExtensions, resolverOverrides } from '../defaultextension'
import { vanillaCells } from '@jsonforms/vanilla-renderers'
import { ZuiFormDEBUG } from '../debugger'
import { exampleSchema } from './exampleschema'
import { ZuiComponentMap } from '../types'
import { transformZuiComponentsToRenderers } from '..'

const meta = {
  title: 'Form/DEBUG',
  component: ZuiFormDEBUG<typeof defaultExtensions>,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ZuiFormDEBUG<typeof defaultExtensions>>

type Story = StoryObj<typeof meta>

const componentMap: ZuiComponentMap<typeof defaultExtensions> = {
  string: {
    datetimeinput: () => null,
    textbox: ({ params, onChange, errors, required, label, data }) => (
      <div style={{ padding: '1rem' }}>
        <span>{label}</span>
        <input
          placeholder={params.fitContentWidth ? 'fitContentWidth' : 'default'}
          onChange={(e) => onChange(e.target.value)}
          type={params.multiline ? 'textarea' : 'text'}
        />
        {required && <span>*</span>}
        {errors && typeof data !== 'undefined' && <span style={{ color: 'red' }}>{errors}</span>}
      </div>
    ),
    default: () => null,
  },
  array: {
    default: () => null,
    select: ({ children }) => <div>array: {children}</div>,
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
    category: () => null,
    default: () => null,
    verticalLayout: () => null,
    horizontalLayout: () => null,
    group: ({ children }) => <div>{children}</div>,
    categorization: () => null,
  },
}

const expandedRenderers = transformZuiComponentsToRenderers(componentMap)

export const ExampleSchema: Story = {
  args: {
    schema: exampleSchema.toJsonSchema({
      target: 'openApi3',
    }),
    overrides: resolverOverrides,
    renderers: [...expandedRenderers],
    cells: vanillaCells,
    fullscreen: false,
  },
}

export default meta
