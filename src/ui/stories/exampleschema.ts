import { Zui, zui as zuiImport } from '../../zui'
import { defaultExtensions } from '../defaultextension'
const zui = zuiImport as Zui<typeof defaultExtensions>

export const exampleSchema = zui
  .object({
    firstName: zui
      .string()
      .displayAs('textbox', {})
      .title('User')
      .disabled()
      .hidden()
      .placeholder('Enter your name')
      .tooltip('yo')
      .nullable(),

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
      .displayAs('select', undefined)
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
  .displayAs('group', {})
  .title('User Information')
