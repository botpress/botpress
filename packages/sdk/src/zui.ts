import { zui, type UIComponentDefinitions, Zui } from '@bpinternal/zui'

export const studioComponentDefinitions = {
    string: {
        debug: {
            id: 'debug',
            schema: zui.object({
                type: zui.literal('debug'),
            }),
        }
    },
    number: {},
    boolean: {},
    object: {},
    array: {},
} satisfies UIComponentDefinitions

declare module '@bpinternal/zui' {
    type ComponentDefinitions = typeof studioComponentDefinitions
}

const studioZui = zui as Zui<typeof studioComponentDefinitions>

export { studioZui as zui }
