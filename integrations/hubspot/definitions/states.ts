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

const PROPERTY_TYPES = [
  'bool',
  'enumeration',
  'date',
  'datetime',
  'string',
  'number',
  'object_coordinates',
  'json',
  'phone_number',
] as const

export const propertyTypeSchema = z.enum(PROPERTY_TYPES)
export type PropertyType = z.infer<typeof propertyTypeSchema>

const propertyCacheStateDefinition = {
  type: 'integration',
  schema: z.object({
    properties: z
      .record(
        z.object({
          label: z.string().title('Label').describe('The label of the property'),
          type: propertyTypeSchema,
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
  }),
} satisfies StateDefinition

export type CrmObjectType = 'ticket' | 'deal' | 'contact' | 'lead'
const propertyCacheStates = {
  ticketPropertyCache: propertyCacheStateDefinition,
  dealPropertyCache: propertyCacheStateDefinition,
  contactPropertyCache: propertyCacheStateDefinition,
  leadPropertyCache: propertyCacheStateDefinition,
} satisfies Record<`${CrmObjectType}PropertyCache`, StateDefinition>

export const states = {
  oauthCredentials,
  ticketPipelineCache,
  companiesCache,
  ...propertyCacheStates,
} satisfies Record<string, StateDefinition>
