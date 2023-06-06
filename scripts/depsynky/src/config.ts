import { YargsSchema } from '@bpinternal/yargs-extra'

const defaultOptions = {
  rootDir: {
    type: 'string',
    default: process.cwd(),
  },
} satisfies YargsSchema

export const bumpSchema = {
  ...defaultOptions,
  sync: {
    type: 'boolean',
    default: true,
  },
} satisfies YargsSchema

export const syncSchema = defaultOptions satisfies YargsSchema

export const checkSchema = defaultOptions satisfies YargsSchema
