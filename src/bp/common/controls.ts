import { FormDynamicOptions } from 'botpress/sdk'

export interface FormOption {
  value: any
  label: string
  related?: any
}

export interface MoreInfo {
  /** Content of the popover when hovering the icon */
  label: string
  /** An URL with additional documentation */
  url?: string
}

export enum ControlType {
  String = 'string',
  Boolean = 'boolean',
  Number = 'number',
  Array = 'array',
  /** Display a dropdown menu with a list of options  */
  Enum = 'enum',
  /** Display an upload component so users can pick a file from their filesystem */
  File = 'file',
  /** A group of fields that can be added multiple times */
  Group = 'group',
  /** Display a custom component from an override field or from a custom module */
  Component = 'component'
}

export interface BaseControl {
  /** Label displayed on top of the control */
  label: string
  /** Display an help icon next to the control */
  moreInfo?: MoreInfo
  defaultValue?: any
  /** When true, the user can provide a different value for this property for each language supported by the bot */
  translatable?: boolean
  /** Indicates that this field must be filled */
  required?: boolean
  /** Text to display in the control when no input is provided */
  placeholder?: string
  /** The name of the section where this property will be */
  section?: string
  /** Action when the label is clicked */
  onClick?: (field: any, parent: any) => void
}

export interface ControlBoolean extends BaseControl {
  type: ControlType.Boolean
  defaultValue?: boolean
}

export interface ControlEnum extends BaseControl {
  type: ControlType.Enum
  defaultValue?: any
  options?: FormOption[]
  dynamicOptions?: FormDynamicOptions
  /** Display a special component to select multiple options */
  multiple?: boolean
}

export interface ControlNumber extends BaseControl {
  type: ControlType.Number
  defaultValue?: number
  max?: number
  min?: number
}

export interface ControlString extends BaseControl {
  type: ControlType.String
  defaultValue?: string
  maxLength?: number
  /** When true, new lines can be added on the field */
  multiline?: boolean
  /** Specify a regex to execute on the user's input, to sanitize a field, for example */
  valueManipulation?: {
    regex: string
    modifier: string
    replaceChar: string
  }
}

export interface ControlArray extends BaseControl {
  type: ControlType.Array
  defaultValue?: string[]
  validation?: {
    /** Each element in the array must match this regular expression */
    regex?: RegExp
    /** Provide a list of allowed choices */
    list?: any[]
    /** Provide a custom validation method */
    validator?: (items: any[], newItem: any) => boolean
  }
  /** The label displayed on the + button to add elements */
  addLabel?: string
  addLabelTooltip?: string
}

export interface ControlFile extends BaseControl {
  type: ControlType.File
}

export interface ControlComponent extends BaseControl {
  type: ControlType.Component
  overrideKey?: string
  moduleName?: string
  componentName?: string
}

export interface ControlGroup extends BaseControl {
  type: ControlType.Group
  addLabel?: string
  addLabelTooltip?: string
  /** Whether or not the first item is created by default */
  defaultItem?: boolean
  // The minimum number of items that must be in the group
  min?: number
  max?: number
  fields?: any
  contextMenu?: any
}

export type Control =
  | ControlBoolean
  | ControlEnum
  | ControlNumber
  | ControlString
  | ControlArray
  | ControlFile
  | ControlComponent
  | ControlGroup

export interface ControlForm {
  [propertyName: string]: Control
}
