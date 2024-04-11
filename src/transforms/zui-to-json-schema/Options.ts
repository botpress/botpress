import type { ZodSchema } from '../../z/index'

export type Targets = 'jsonSchema7' | 'jsonSchema2019-09' | 'openApi3'

export type Options<Target extends Targets = 'jsonSchema7'> = {
  name: string | undefined
  $refStrategy: 'root' | 'relative' | 'none' | 'seen'
  basePath: string[]
  effectStrategy: 'input' | 'any'
  pipeStrategy: 'input' | 'output' | 'all'
  dateStrategy: 'string' | 'integer'
  mapStrategy: 'entries' | 'record'
  target: Target
  strictUnions: boolean
  definitionPath: string
  definitions: Record<string, ZodSchema>
  errorMessages: boolean
  markdownDescription: boolean
  patternStrategy: 'escape' | 'preserve'
  emailStrategy: 'format:email' | 'format:idn-email' | 'pattern:zod'
  discriminator: boolean
  unionStrategy: 'anyOf' | 'oneOf'
}

export const defaultOptions: Options = {
  name: undefined,
  $refStrategy: 'root',
  basePath: ['#'],
  effectStrategy: 'input',
  pipeStrategy: 'all',
  dateStrategy: 'string',
  mapStrategy: 'entries',
  definitionPath: 'definitions',
  target: 'jsonSchema7',
  strictUnions: false,
  definitions: {},
  errorMessages: false,
  markdownDescription: false,
  patternStrategy: 'escape',
  emailStrategy: 'format:email',
  discriminator: false,
  unionStrategy: 'anyOf',
}

export const getDefaultOptions = <Target extends Targets>(options: Partial<Options<Target>> | string | undefined) =>
  (typeof options === 'string'
    ? {
        ...defaultOptions,
        name: options,
      }
    : {
        ...defaultOptions,
        ...options,
      }) as Options<Target>
