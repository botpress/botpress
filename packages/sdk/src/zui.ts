import { z, type UIComponentDefinitions } from '@bpinternal/zui'
export * from '@bpinternal/zui'

const commonInputParams = z.object({
  allowDynamicVariable: z.boolean().optional(),
  horizontal: z.boolean().optional(),
})

export const studioComponentDefinitions = [
  {
    type: 'string',
    id: 'textInput',
    schema: commonInputParams.extend({
      multiLine: z.boolean().optional(),
      growVertically: z.boolean().optional(),
      suggestions: z.array(z.string()).optional(),
    }),
  },
  {
    type: 'string',
    id: 'dropdown',
    schema: commonInputParams.extend({
      filterable: z.boolean().optional(),
    }),
  },
  {
    type: 'string',
    id: 'radiogroup',
    schema: commonInputParams.extend({}),
  },
  {
    type: 'string',
    id: 'datepicker',
    schema: commonInputParams.extend({
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
  {
    type: 'string',
    id: 'timepicker',
    schema: commonInputParams.extend({
      useAMPM: z.boolean().optional(),
      timeFormat: z.string().optional(),
      minTime: z.string().optional(),
      maxTime: z.string().optional(),
      showArrowButtons: z.boolean().optional(),
      precision: z.enum(['minute', 'second', 'millisecond']).optional(),
    }),
  },
  {
    type: 'string',
    id: 'variablepicker',
    schema: z.object({
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
  {
    type: 'string',
    id: 'richTextEditor',
    schema: z.object({
      allowDynamicVariable: z.boolean().optional(),
      resizable: z.boolean().optional(),
    }),
  },
  {
    type: 'string',
    id: 'JSONInput',
    schema: commonInputParams.extend({
      showPreview: z.boolean().optional(),
      showValidationError: z.boolean().optional(),
    }),
  },
  {
    type: 'string',
    id: 'fileInput',
    schema: commonInputParams.extend({
      fileTypes: z.array(z.enum(['image', 'audio', 'video'])).optional(),
      showUploadedFiles: z.boolean().optional(),
    }),
  },
  {
    type: 'number',
    id: 'numberInput',
    schema: commonInputParams.extend({
      allowNumericCharactersOnly: z.boolean().optional(),
      stepSize: z.number().optional(),
    }),
  },
  {
    type: 'number',
    id: 'slider',
    schema: z.object({
      horizontal: z.boolean().optional(),
      stepSize: z.number().optional(),
    }),
  },
  {
    type: 'boolean',
    id: 'switch',
    schema: commonInputParams,
  },
  {
    type: 'array',
    id: 'optionList',
    schema: commonInputParams,
  },
  {
    type: 'array',
    id: 'stringList',
    schema: commonInputParams,
  },
  {
    type: 'object',
    id: 'collapsible',
    schema: z.object({
      defaultOpen: z.boolean().optional(),
    }),
  },
] satisfies UIComponentDefinitions

declare module '@bpinternal/zui' {
  type ComponentDefinitions = typeof studioComponentDefinitions
}

export default z
export { z }
