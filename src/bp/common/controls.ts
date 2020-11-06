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
  /** Displays a button which opens a full-sized code editor  */
  CodeEditor = 'code-editor',
  /** Display a custom component from an override field or from a custom module */
  Component = 'component'
}

export interface BaseControl {
  /** Label displayed on top of the control */
  title?: string
  /** Display an help icon next to the control */
  moreInfo?: MoreInfo
  defaultValue?: any
  /** When true, the user can provide a different value for this property for each language supported by the bot */
  translated?: boolean
  /** Indicates that this field must be filled */
  required?: boolean
  /** Text to display in the control when no input is provided */
  placeholder?: string
  /** The name of the section where this property will be */
  section?: string
  // TODO: Unsure about these 3, keeping them temporarily
  fields?: any
  onClick?: any
  group?: any
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

export interface CustomTemplate {
  beforeCode?: string
  afterCode?: string
}

export interface ControlCodeEditor extends BaseControl {
  type: ControlType.CodeEditor
  /** The base template to wrap the code with */
  template?: string | CustomTemplate
}

export type Control =
  | ControlBoolean
  | ControlEnum
  | ControlNumber
  | ControlString
  | ControlArray
  | ControlFile
  | ControlComponent
  | ControlCodeEditor

export interface ControlForm {
  [propertyName: string]: Control
}
