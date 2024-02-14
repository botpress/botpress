import type { Meta, StoryObj } from '@storybook/react'
import { defaultExtensionComponents } from '../defaultextension'
import { defaultExtensions } from '../defaultextension'
import { vanillaCells, vanillaRenderers } from '@jsonforms/vanilla-renderers'
import { ZuiFormDEBUG } from '../debugger'
import { exampleSchema } from './exampleschema'

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

export const ExampleSchema: Story = {
  args: {
    schema: exampleSchema.toJsonSchema(),
    components: defaultExtensionComponents,
    renderers: vanillaRenderers,
    cells: vanillaCells,
    fullscreen: true,
  },
}

export default meta
