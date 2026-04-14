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

export type CrmObjectType = 'ticket' | 'deal' | 'contact' | 'lead' | 'company'
const propertyCacheStates = {
  ticketPropertyCache: propertyCacheStateDefinition,
  dealPropertyCache: propertyCacheStateDefinition,
  contactPropertyCache: propertyCacheStateDefinition,
  leadPropertyCache: propertyCacheStateDefinition,
  companyPropertyCache: propertyCacheStateDefinition,
} satisfies Record<`${CrmObjectType}PropertyCache`, StateDefinition>

const hitlConfig = {
  type: 'integration' as const,
  schema: z.object({
    channelId: z.string().title('Channel ID').describe('The HubSpot custom channel ID'),
    defaultInboxId: z.string().title('Default Inbox ID').describe('The inbox used when no inboxId is specified in startHitl'),
    channelAccounts: z
      .record(z.string())
      .title('Channel Accounts')
      .describe('Map of inboxId to channelAccountId for all connected inboxes'),
  }),
} satisfies StateDefinition

const hitlUserInfo = {
  type: 'user' as const,
  schema: z.object({
    name: z.string().title('Name').describe('The display name of the user'),
    contactIdentifier: z.string().title('Contact Identifier').describe('Email address or phone number of the user'),
    contactType: z
      .enum(['email', 'phone'])
      .title('Contact Type')
      .describe('Whether the identifier is an email or phone number'),
  }),
} satisfies StateDefinition

const hitlSetupWizard = {
  type: 'integration' as const,
  schema: z.object({
    enableHitl: z.boolean().title('Enable HITL').describe('Whether HITL is enabled for this integration'),
    selectedInboxIds: z.array(z.string()).optional().title('Selected Inbox IDs').describe('Inboxes selected during wizard setup'),
    defaultInboxId: z.string().optional().title('Default Inbox ID').describe('The inbox used by default in startHitl'),
    channelId: z.string().optional().title('Channel ID').describe('HubSpot custom channel ID, saved between wizard steps'),
  }),
} satisfies StateDefinition

export const states = {
  oauthCredentials,
  ticketPipelineCache,
  companiesCache,
  ...propertyCacheStates,
  hitlConfig,
  hitlUserInfo,
  hitlSetupWizard,
} satisfies Record<string, StateDefinition>
