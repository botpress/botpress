import type { Meta, StoryObj } from '@storybook/react'
import { ZuiForm } from '..'
import { defaultExtensions, resolverOverrides } from '../defaultextension'
import { vanillaCells, vanillaRenderers } from '@jsonforms/vanilla-renderers'
import { exampleSchema } from './exampleschema'

const meta = {
  title: 'Form/Example',
  component: ZuiForm<typeof defaultExtensions>,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ZuiForm<typeof defaultExtensions>>

type Story = StoryObj<typeof meta>

export const ExampleSchema: Story = {
  args: {
    schema: exampleSchema.toJsonSchema(),
    overrides: resolverOverrides,
    renderers: vanillaRenderers,
    cells: vanillaCells,
  },
}

export default meta
