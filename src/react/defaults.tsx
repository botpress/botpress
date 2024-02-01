import React from 'react'
import type { ZUIReactComponentLibrary, ZUIReactComponent } from '.'
import { defaultExtensions } from '../uiextensions'

const TextBox: ZUIReactComponent<'string', 'textbox', typeof defaultExtensions> = ({ params }) => {
  return <input {...params} />
}

const NumberSlider: ZUIReactComponent<'number', 'slider', typeof defaultExtensions> = ({ params }) => {
  return <input {...params} />
}

const DatetimeInput: ZUIReactComponent<'string', 'datetimeinput', typeof defaultExtensions> = ({ params }) => {
  return <input {...params} />
}

const NumberInput: ZUIReactComponent<'number', 'numberinput', typeof defaultExtensions> = ({ params }) => {
  return <input {...params} />
}

const BooleanCheckbox: ZUIReactComponent<'boolean', 'checkbox', typeof defaultExtensions> = ({ params }) => {
  return <input {...params} />
}

const SelectList: ZUIReactComponent<'array', 'select', typeof defaultExtensions> = ({ params }) => {
  return (
    <select {...params}>
      {params.options.map((option) => (
        <option value={option.value}>{option.label}</option>
      ))}
    </select>
  )
}

export const defaultComponentLibrary: ZUIReactComponentLibrary<typeof defaultExtensions> = {
  string: {
    textbox: TextBox,
    datetimeinput: DatetimeInput,
  },
  number: {
    slider: NumberSlider,
    numberinput: NumberInput,
  },
  boolean: {
    checkbox: BooleanCheckbox,
  },
  array: {
    select: SelectList,
  },
  object: {},
}
