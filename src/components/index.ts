import { AutoComplete, BaseControl, BaseDropdown, BaseDropdownOptions, EnumOption } from './common'

export type JsonFormElement =
  | JsonForm.Text
  | JsonForm.Checkbox
  | JsonForm.Radio
  | JsonForm.Switch
  | JsonForm.Number
  | JsonForm.Slider
  | JsonForm.Dropdown
  | JsonForm.IntegrationPicker
  | JsonForm.IntentPicker
  | JsonForm.VariablePicker
  | JsonForm.VerticalLayout
  | JsonForm.CollapsiblePanel
  | JsonForm.List
  | JsonForm.CodeEditor
  | { type: string }

export namespace JsonForm {
  export type VerticalLayout = {
    type: 'VerticalLayout'
    elements: JsonFormElement[]
  }

  export type CollapsiblePanel = {
    type: 'CollapsiblePanel'
    elements: JsonFormElement[]
    options: {
      label: string
    }
  }

  export type Checkbox = BaseControl & { type: 'Checkbox' }
  export type Switch = BaseControl & { type: 'Switch' }

  // A super input can support using templates to compute or get values from an object {{some_text}}
  export type SuperInput = { superInput?: boolean }

  export type Text = BaseControl & {
    type: 'Text'
    options?: {
      placeholder?: string
      multiLine?: boolean
      rows?: number
      // Value is displayed
      hideOnBlur?: boolean
    } & SuperInput &
      AutoComplete
  }

  export type Number = BaseControl & {
    type: 'Number'
    options?: {
      placeholder?: string
    } & SuperInput
  }

  /**
   * @type number
   * Use this component when the min/max values specified are small.
   */
  export type Slider = BaseControl & {
    type: 'Slider'
    options?: {
      stepSize?: number
    }
  }

  export type List = BaseControl & {
    type: 'List'
    options?: AutoComplete
  }

  export type Dropdown = BaseDropdown & { type: 'Dropdown' | 'Enum' }
  export type Radio = BaseControl & {
    type: 'Radio' | 'Enum'
    options?: {
      items: EnumOption[]
    }
  }

  export type IntentPicker = BaseDropdown & { type: 'IntentPicker' }

  export type IntegrationPicker = BaseDropdown & {
    type: 'IntegrationPicker'
    options?: BaseDropdownOptions & {
      supportedIntegrations?: string[] | EnumOption[]
    }
  }

  export type VariablePicker = BaseControl & {
    type: 'VariablePicker'
    options?: {
      /** @default string */
      variableType?: string
      placeholder?: string
      disabled?: boolean
      hideNoneOption?: boolean
    }
  }

  export type CodeEditor = BaseControl & {
    type: 'CodeEditor'
    options?: {
      wrapper?: string
    }
  }
}
