import { z, StateDefinition } from '@botpress/sdk'

const oauthCredentials = {
  type: 'integration',
  schema: z.object({
    accessToken: z.string().title('Access Token').describe('The access token for the Hubspot integration'),
    refreshToken: z.string().title('Refresh Token').describe('The refresh token for the Hubspot integration'),
    expiresAtSeconds: z.number().title('Expires At').describe('The timestamp in seconds when the access token expires'),
  }),
} satisfies StateDefinition

const ticketPipelineCache = {
  type: 'integration',
  schema: z.object({
    pipelines: z
      .record(
        z.object({
          label: z.string().title('Label').describe('The label of the pipeline'),
          stages: z
            .record(
              z.object({
                label: z.string().title('Label').describe('The label of the pipeline stage'),
              })
            )
            .title('Stages')
            .describe('A mapping of pipeline stage ids (string) to pipeline stages'),
        })
      )
      .title('Pipelines')
      .describe('A mapping of pipeline ids (string) to pipelines'),
  }),
} satisfies StateDefinition

const companiesCache = {
  type: 'integration',
  schema: z.object({
    companies: z
      .record(
        z.object({
          name: z.string().optional().title('Name').describe('The name of the company'),
          domain: z.string().optional().title('Domain').describe('The domain of the company'),
        })
      )
      .title('Companies')
      .describe('A mapping of company ids (string) to company details'),
  }),
} satisfies StateDefinition

const DEFAULT_PROPERTY_TYPES = [
  'bool',
  'enumeration',
  'date',
  'datetime',
  'string',
  'number',
  'object_coordinates',
  'json',
] as const
const CONTACT_PROPERTY_TYPES = [...DEFAULT_PROPERTY_TYPES, 'phone_number'] as const

export const propertyTypesSchema = z.enum(DEFAULT_PROPERTY_TYPES)
export type PropertyTypes = z.infer<typeof propertyTypesSchema>

const makePropertyCacheSchema = <TTypes extends readonly [string, ...string[]]>(allowedTypes: TTypes) =>
  z.object({
    properties: z
      .record(
        z.object({
          label: z.string().title('Label').describe('The label of the property'),
          type: z.enum(allowedTypes),
          hubspotDefined: z.boolean().title('Hubspot Defined').describe('Whether the property is defined by Hubspot'),
          options: z
            .array(z.string())
            .optional()
            .title('Options')
            .describe('The options of the property if it is an enumeration'),
        })
      )
      .title('Properties')
      .describe('A mapping of property names (string) to property details'),
  })

const ticketPropertyCache = {
  type: 'integration',
  schema: makePropertyCacheSchema(DEFAULT_PROPERTY_TYPES),
} satisfies StateDefinition

const contactPropertyCache = {
  type: 'integration',
  schema: makePropertyCacheSchema(CONTACT_PROPERTY_TYPES),
} satisfies StateDefinition

const dealPropertyCache = {
  type: 'integration',
  schema: makePropertyCacheSchema(DEFAULT_PROPERTY_TYPES),
} satisfies StateDefinition

const leadPropertyCache = {
  type: 'integration',
  schema: makePropertyCacheSchema(DEFAULT_PROPERTY_TYPES),
} satisfies StateDefinition

export const states = {
  oauthCredentials,
  ticketPipelineCache,
  companiesCache,
  ticketPropertyCache,
  contactPropertyCache,
  dealPropertyCache,
  leadPropertyCache,
}
