import z, { zui, UIComponentDefinitions } from '@bpinternal/zui'

const studioComponentDefinitions = {
  string: {},
  array: {},
  boolean: {},
  number: {},
  object: {},
} satisfies UIComponentDefinitions

declare module '@bpinternal/zui' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- Must be interface for type inference
  interface ComponentDefinitions {
    components: typeof studioComponentDefinitions
  }
}

export { z, zui }

