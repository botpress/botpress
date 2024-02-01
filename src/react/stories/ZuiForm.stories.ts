import type { Meta, StoryObj } from '@storybook/react'
import { ZuiForm, defaultComponentLibrary } from '..'
import { defaultExtensions } from '../../uiextensions'
import { Zui, zui as zuiImport } from '../../zui'

const meta = {
  title: 'Form/Example',
  component: ZuiForm<typeof defaultExtensions>,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ZuiForm<typeof defaultExtensions>>

type Story = StoryObj<typeof meta>

const zui = zuiImport as Zui<typeof defaultExtensions>

const exampleSchema = zui.object({
  firstName: zui.string().displayAs('textbox', {
    name: 'firstName',
    type: 'text',
    required: true,
    placeholder: 'First Name',
  }),
  lastName: zui.string().displayAs('textbox', {
    name: 'lastName',
    type: 'text',
    required: true,
    placeholder: 'Last Name',
  }),
  birthday: zui.string().displayAs('datetimeinput', {
    name: 'birthday',
    type: 'date',
    required: true,
  }),
  email: zui.string().displayAs('textbox', {
    name: 'email',
    type: 'email',
    required: true,
    placeholder: 'Email',
  }),
  password: zui.string().displayAs('textbox', {
    name: 'password',
    type: 'password',
    required: true,
    placeholder: 'Password',
  }),
  passwordConfirm: zui.string().displayAs('textbox', {
    name: 'passwordConfirm',
    type: 'password',
    required: true,
    placeholder: 'Confirm Password',
  }),
})

export const ExampleSchema: Story = {
  args: {
    components: defaultComponentLibrary,
    schema: exampleSchema.toJsonSchema(),
  },
}

export default meta
