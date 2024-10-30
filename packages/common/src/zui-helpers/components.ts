import * as sdk from '@botpress/sdk'
const { z } = sdk

const _studioComponentDefinitions = {
  number: {
    slider: {
      id: 'slider',
      params: z.object({
        horizontal: z.boolean().optional(),
        stepSize: z.number().optional(),
      }),
    },
  },
  array: {
    options: {
      id: 'options',
      params: z.object({ horizontal: z.boolean().optional() }),
    },
  },
  string: {
    text: {
      id: 'text',
      params: z.object({
        multiLine: z.boolean().optional(),
        growVertically: z.boolean().optional(),
      }),
    },
    radiogroup: {
      id: 'radiogroup',
      params: z.object({ horizontal: z.boolean().optional() }),
    },
    richtext: {
      id: 'richtext',
      params: z.object({ resizable: z.boolean().optional() }),
    },
  },
  object: {
    collapsible: {
      id: 'collapsible',
      params: z.object({ defaultOpen: z.boolean().optional() }),
    },
  },
} as const satisfies Omit<sdk.UIComponentDefinitions, OmittedComponents>

type OmittedComponents = 'discriminatedUnion' | 'boolean'
type StudioComponentDefinitions = Pick<sdk.UIComponentDefinitions, OmittedComponents> &
  typeof _studioComponentDefinitions

/**
 * A number field that gets displayed as a slider
 * @param stepSize - The step size of the slider
 */
export const slider = ({ stepSize = 1 }: { stepSize: number } = { stepSize: 1 }) =>
  z.number().displayAs<StudioComponentDefinitions>({ id: 'slider', params: { stepSize, horizontal: false } })

/**
 * A string field that gets displayed as an auto-expanding text area
 */
export const multiLineString = () =>
  z.string().displayAs<StudioComponentDefinitions>({ id: 'text', params: { multiLine: true, growVertically: true } })

/**
 * A string field that gets displayed as a rich text editor. The result is stored as HTML
 */
export const multiLineRichText = () =>
  z.string().displayAs<StudioComponentDefinitions>({ id: 'richtext', params: { resizable: true } })

/**
 * A string field that gets displayed as a radio group. Each option gets its own radio button
 * @param options - The options to display as radio buttons
 */
export const radioGroup = (options: readonly [string, ...string[]]) =>
  z.enum(options).displayAs<StudioComponentDefinitions>({ id: 'radiogroup', params: { horizontal: false } })

/**
 * An object field that gets displayed as a collapsible section
 * @param schema - The schema of the object
 * @param isCollapsed - Whether the object should be collapsed by default
 */
export const collapsibleObject = <T extends sdk.ZodRawShape>(
  shape: T,
  { isCollapsed = false }: { isCollapsed: boolean } = { isCollapsed: false }
) => z.object(shape).displayAs<StudioComponentDefinitions>({ id: 'collapsible', params: { defaultOpen: !isCollapsed } })
