import { z, type UIComponentDefinitions, type DefaultComponentDefinitions } from '@bpinternal/zui'
export * from '@bpinternal/zui'

const commonInputParams = z.object({
  allowDynamicVariable: z.boolean().optional(),
  horizontal: z.boolean().optional(),
})

export const studioComponentDefinitions = {
  string: {
    textInput: {
      id: 'textInput',
      params: commonInputParams.extend({
        multiLine: z.boolean().optional(),
        growVertically: z.boolean().optional(),
        suggestions: z.array(z.string()).optional(),
      }),
    },
    dropdown: {
      id: 'dropdown',
      params: commonInputParams.extend({
        filterable: z.boolean().optional(),
      }),
    },
    radiogroup: {
      id: 'radiogroup',
      params: commonInputParams.extend({}),
    },
    datepicker: {
      id: 'datepicker',
      params: commonInputParams.extend({
        dateFormat: z.string().optional(),
        minDate: z.string().optional(),
        maxDate: z.string().optional(),
        defaultTimezone: z.string().optional(),
        disableTimezoneSelection: z.boolean().optional(),
        highlightCurrentDay: z.boolean().optional(),
        showShortcutButtons: z.boolean().optional(),
        showOutsideDaysOfMonth: z.boolean().optional(),
        firstDayOfWeek: z.number().optional(),
        canChangeMonth: z.boolean().optional(),
        showWeekNumbers: z.boolean().optional(),
      }),
    },
    timepicker: {
      id: 'timepicker',
      params: commonInputParams.extend({
        useAMPM: z.boolean().optional(),
        timeFormat: z.string().optional(),
        minTime: z.string().optional(),
        maxTime: z.string().optional(),
        showArrowButtons: z.boolean().optional(),
        precision: z.enum(['minute', 'second', 'millisecond']).optional(),
      }),
    },
    variablepicker: {
      id: 'variablepicker',
      params: z.object({
        type: z.enum([
          'any',
          'string',
          'number',
          'boolean',
          'object',
          'pattern',
          'date',
          'array',
          'target',
          'time',
          'enum',
        ]),
        horizontal: z.boolean().optional(),
      }),
    },
    richTextEditor: {
      id: 'richTextEditor',
      params: z.object({
        allowDynamicVariable: z.boolean().optional(),
        resizable: z.boolean().optional(),
      }),
    },
    JSONInput: {
      id: 'JSONInput',
      params: commonInputParams.extend({
        showPreview: z.boolean().optional(),
        showValidationError: z.boolean().optional(),
      }),
    },
    fileInput: {
      id: 'fileInput',
      params: commonInputParams.extend({
        fileTypes: z.array(z.enum(['image', 'audio', 'video'])).optional(),
        showUploadedFiles: z.boolean().optional(),
      }),
    },
  },
  number: {
    numberInput: {
      id: 'numberInput',
      params: commonInputParams.extend({
        allowNumericCharactersOnly: z.boolean().optional(),
        stepSize: z.number().optional(),
      }),
    },
    slider: {
      id: 'slider',
      params: z.object({
        horizontal: z.boolean().optional(),
        stepSize: z.number().optional(),
      }),
    },
  },
  boolean: {
    switch: {
      id: 'switch',
      params: commonInputParams,
    },
  },
  array: {
    optionList: {
      id: 'optionList',
      params: commonInputParams,
    },
    stringList: {
      id: 'stringList',
      params: commonInputParams,
    },
  },
  object: {
    collapsible: {
      id: 'collapsible',
      params: z.object({
        defaultOpen: z.boolean().optional(),
      }),
    },
  },
  discriminatedUnion: {},
} as const satisfies UIComponentDefinitions

export type UI<Namespace extends 'studio' | 'dashboard' = 'studio'> = Namespace extends 'studio'
  ? typeof studioComponentDefinitions
  : Namespace extends 'dashboard'
  ? DefaultComponentDefinitions
  : any

export default z
export { z }
