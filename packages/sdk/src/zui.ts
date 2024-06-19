import { z, type UIComponentDefinitions, type DefaultComponentDefinitions } from '@bpinternal/zui'
export * from '@bpinternal/zui'

const commonInputParams = z.object({
  allowDynamicVariable: z.boolean().optional(),
  horizontal: z.boolean().optional(),
})

export const studioComponentDefinitions = {
  string: {
    text: {
      id: 'text',
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
    date: {
      id: 'date',
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
    time: {
      id: 'time',
      params: commonInputParams.extend({
        useAMPM: z.boolean().optional(),
        timeFormat: z.string().optional(),
        minTime: z.string().optional(),
        maxTime: z.string().optional(),
        showArrowButtons: z.boolean().optional(),
        precision: z.enum(['minute', 'second', 'millisecond']).optional(),
      }),
    },
    richtext: {
      id: 'richtext',
      params: z.object({
        allowDynamicVariable: z.boolean().optional(),
        resizable: z.boolean().optional(),
      }),
    },
    json: {
      id: 'json',
      params: commonInputParams.extend({
        showPreview: z.boolean().optional(),
        showValidationError: z.boolean().optional(),
      }),
    },
    file: {
      id: 'file',
      params: commonInputParams.extend({
        fileTypes: z.array(z.enum(['image', 'audio', 'video'])).optional(),
        showUploadedFiles: z.boolean().optional(),
      }),
    },
  },
  number: {
    number: {
      id: 'number',
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
    options: {
      id: 'options',
      params: commonInputParams,
    },
    strings: {
      id: 'strings',
      params: commonInputParams,
    },
    daterange: {
      id: 'daterange',
      params: z.object({
        dateFormat: z.string().optional(),
        minDate: z.string().optional(),
        maxDate: z.string().optional(),
        defaultTimezone: z.string().optional(),
        allowSingleDayRange: z.boolean().optional(),
        highlightCurrentDay: z.boolean().optional(),
        showOutsideDaysOfMonth: z.boolean().optional(),
        firstDayOfWeek: z.number().optional(),
        canChangeMonth: z.boolean().optional(),
        showWeekNumbers: z.boolean().optional(),
      }),
    },
  },
  object: {
    collapsible: {
      id: 'collapsible',
      params: z.object({
        defaultOpen: z.boolean().optional(),
      }),
    },
    modal: {
      id: 'modal',
      params: z.object({
        title: z.string().optional(),
        buttonLabel: z.string().optional(),
        closeButtonLabel: z.string().optional(),
      }),
    },
    popover: {
      id: 'popover',
      params: z.object({
        buttonLabel: z.string().optional(),
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

export type GenericZuiSchema<
  A extends Record<string, z.ZodTypeAny> = Record<string, z.ZodTypeAny>,
  R extends z.ZodTypeAny = z.ZodTypeAny
> = (typeArguments: A) => R

export default z
