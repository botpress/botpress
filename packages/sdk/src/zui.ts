import { zui, type UIComponentDefinitions, Zui } from '@bpinternal/zui'
import  { z } from 'zod'

const commonInputParams = z.object({
    allowDynamicVariable: z.boolean().optional(),
    horizontal: z.boolean().optional()
  })

export const studioComponentDefinitions = {
    string: {
      textInput: {
        id: 'textInput',
        schema: commonInputParams.extend({
          multiLine: z.boolean().optional(),
          growVertically: z.boolean().optional(),
          suggestions: z.array(z.string()).optional()
        })
      },
      dropdown: {
        id: 'dropdown',
        schema: commonInputParams.extend({
          filterable: z.boolean().optional()
        })
      },
      radiogroup: {
        id: 'radiogroup',
        schema: commonInputParams.extend({})
      },
      datepicker: {
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
          showWeekNumbers: z.boolean().optional()
        })
      },
      timepicker: {
        id: 'timepicker',
        schema: commonInputParams.extend({
          useAMPM: z.boolean().optional(),
          timeFormat: z.string().optional(),
          minTime: z.string().optional(),
          maxTime: z.string().optional(),
          showArrowButtons: z.boolean().optional(),
          precision: z.enum(['minute', 'second', 'millisecond']).optional()
        })
      },
      variablepicker: {
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
            'enum'
          ]),
          horizontal: z.boolean().optional()
        })
      },
      richTextEditor: {
        id: 'richTextEditor',
        schema: z.object({
          allowDynamicVariable: z.boolean().optional(),
          resizable: z.boolean().optional()
        })
      },
      JSONInput: {
        id: 'JSONInput',
        schema: commonInputParams.extend({
          showPreview: z.boolean().optional(),
          showValidationError: z.boolean().optional()
        })
      },
      fileInput: {
        id: 'fileInput',
        schema: commonInputParams.extend({
          fileTypes: z.array(z.enum(['image', 'audio', 'video'])).optional(),
          showUploadedFiles: z.boolean().optional()
        })
      }
    },
    number: {
      numberInput: {
        id: 'numberInput',
        schema: commonInputParams.extend({
          allowNumericCharactersOnly: z.boolean().optional(),
          stepSize: z.number().optional()
        })
      },
      slider: {
        id: 'slider',
        schema: z.object({
          horizontal: z.boolean().optional(),
          stepSize: z.number().optional()
        })
      }
    },
    boolean: {
      switch: {
        id: 'switch',
        schema: commonInputParams
      }
    },
    array: {
      optionList: {
        id: 'optionList',
        schema: commonInputParams
      },
      stringList: {
        id: 'stringList',
        schema: commonInputParams
      }
    },
    object: {
      collapsible: {
        id: 'collapsible',
        schema: z.object({
          defaultOpen: z.boolean().optional()
        })
      }
    }
  } satisfies UIComponentDefinitions

declare module '@bpinternal/zui' {
    type ComponentDefinitions = typeof studioComponentDefinitions
}

const studioZui = zui as Zui<typeof studioComponentDefinitions>

export { studioZui as zui }
