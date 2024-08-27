import z from '../z'
import { UIComponentDefinitions } from './types'

export const defaultComponentDefinitions = {
  string: {},
  number: {
    slider: {
      id: 'slider',
      params: z.object({}),
    },
  },
  boolean: {
    switch: {
      id: 'switch',
      params: z.object({}),
    },
  },
  array: {},
  object: {},
  discriminatedUnion: {},
} as const satisfies UIComponentDefinitions

export type DefaultComponentDefinitions = typeof defaultComponentDefinitions
