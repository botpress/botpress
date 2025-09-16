import * as sdk from '@botpress/sdk'
import { Client as OfficialHubspotClient, AssociationTypes } from '@hubspot/api-client'
import {
  AssociationSpecAssociationCategoryEnum,
  FilterOperatorEnum as ContactFilterOperator,
} from '@hubspot/api-client/lib/codegen/crm/contacts'
import { FilterOperatorEnum as DealFilterOperator } from '@hubspot/api-client/lib/codegen/crm/deals'
import { FilterOperatorEnum as LeadFilterOperator } from '@hubspot/api-client/lib/codegen/crm/objects/leads'
import { CrmObjectType } from '../../definitions/states'
import { handleErrorsDecorator as handleErrors } from './error-handling'
import { PropertiesCache } from './properties-cache'
import * as bp from '.botpress'

type TicketPipelinesCache = bp.states.States['ticketPipelineCache']['payload']['pipelines']
type TicketPipeline = TicketPipelinesCache[string]
const PAGING_LIMIT = 100

// Builtin properties normally returned by API when doing a 'get' operation
const DEFAULT_CONTACT_PROPERTIES = ['createdate', 'email', 'firstname', 'lastmodifieddate', 'lastname', 'phone']
const DEFAULT_COMPANY_PROPERTIES = ['createdate', 'domain', 'name', 'hs_lastmodifieddate', 'phone']
const DEFAULT_DEAL_PROPERTIES = [
  'dealname',
  'pipeline',
  'dealstage',
  'closedate',
  'amount',
  'hubspot_owner_id',
  'createdate',
  'hs_lastmodifieddate',
  'hs_lastactivitydate',
  'hs_last_contacted',
  'hs_next_activity_date',
  'num_associated_contacts',
]
const DEFAULT_LEAD_PROPERTIES = [
  'hs_lead_name',
  'hs_pipeline_stage',
  'hs_createdate',
  'hs_lastmodifieddate',
  'hs_lead_name',
  'hs_lead_name_calculated',
  'hs_object_id',
  'hs_object_source',
  'hs_object_source_id',
  'hs_object_source_label',
  'hs_pipeline',
  'hs_pipeline_stage',
  'hs_pipeline_stage_last_updated',
  'hs_primary_associated_object_name',
]
const DEFAULT_TICKET_PROPERTIES = [
  'createdate',
  'hs_pipeline',
  'hs_pipeline_stage',
  'hs_ticket_category',
  'hs_ticket_priority',
  'subject',
]

export class HubspotClient {
  private readonly _hsClient: OfficialHubspotClient
  private readonly _client: bp.Client
  private readonly _ctx: bp.Context
  private readonly _accessToken: string

  private _crmObjectPropertiesCaches: Record<CrmObjectType, PropertiesCache>
  private _ticketPipelines: TicketPipelinesCache | undefined
  private _ticketPipelinesAlreadyRefreshed: boolean = false

  public constructor({ accessToken, client, ctx }: { accessToken: string; client: bp.Client; ctx: bp.Context }) {
    this._client = client
    this._ctx = ctx
    this._accessToken = accessToken
    this._hsClient = new OfficialHubspotClient({ accessToken, numberOfApiCallRetries: 2 })
    this._crmObjectPropertiesCaches = {
      contact: PropertiesCache.create({ client, ctx, accessToken, type: 'contact' }),
      deal: PropertiesCache.create({ client, ctx, accessToken, type: 'deal' }),
      lead: PropertiesCache.create({ client, ctx, accessToken, type: 'lead' }),
      ticket: PropertiesCache.create({ client, ctx, accessToken, type: 'ticket' }),
    }
  }

  @handleErrors('Failed to validate authentication')
  public async getHubId() {
    const { hubId } = await this._hsClient.oauth.accessTokensApi.get(this._accessToken)
    return hubId.toString()
  }

  @handleErrors('Failed to search contact')
  public async searchContact({
    email,
    phone,
    propertiesToReturn,
  }: {
    email?: string
    phone?: string
    propertiesToReturn?: string[]
  }) {
    type SearchRequest = Parameters<OfficialHubspotClient['crm']['contacts']['searchApi']['doSearch']>[0]
    type Filter = NonNullable<SearchRequest['filterGroups']>[number]['filters'][number]

    const filters: Filter[] = []
    if (phone) {
      filters.push({
        propertyName: 'phone',
        operator: ContactFilterOperator.Eq,
        value: phone.trim(),
      })
    }
    if (email) {
      filters.push({
        propertyName: 'email',
        operator: ContactFilterOperator.Eq,
        value: email.trim(),
      })
    }
    if (!filters.length) {
      throw new sdk.RuntimeError('Missing required filters: phone and/or email')
    }

    await this._validateProperties({ properties: propertiesToReturn ?? [], type: 'contact' })

    const contacts = await this._hsClient.crm.contacts.searchApi.doSearch({
      filterGroups: [
        {
          filters,
        },
      ],
      properties: [...DEFAULT_CONTACT_PROPERTIES, ...(propertiesToReturn ?? [])],
    })
    const hsContact = contacts.results[0]
    if (!hsContact) {
      throw new sdk.RuntimeError('Unable to find contact')
    }

    return hsContact
  }

  @handleErrors('Failed to get contact by ID')
  public async getContactById({ contactId, propertiesToReturn }: { contactId: number; propertiesToReturn?: string[] }) {
    const contact = await this._hsClient.crm.contacts.basicApi.getById(contactId.toString(), [
      ...DEFAULT_CONTACT_PROPERTIES,
      ...(propertiesToReturn ?? []),
    ])
    return contact
  }

  @handleErrors('Failed to get company by ID')
  public async getCompanyById({ companyId, propertiesToReturn }: { companyId: number; propertiesToReturn?: string[] }) {
    const company = await this._hsClient.crm.companies.basicApi.getById(companyId.toString(), [
      ...DEFAULT_COMPANY_PROPERTIES,
      ...(propertiesToReturn ?? []),
    ])
    return company
  }

  @handleErrors('Failed to get ticket by ID')
  public async getTicketById({ ticketId, propertiesToReturn }: { ticketId: number; propertiesToReturn?: string[] }) {
    const ticket = await this._hsClient.crm.tickets.basicApi.getById(ticketId.toString(), [
      ...DEFAULT_TICKET_PROPERTIES,
      ...(propertiesToReturn ?? []),
    ])

    if (!ticket.properties.hs_pipeline || !ticket.properties.hs_pipeline_stage) {
      throw new sdk.RuntimeError('Ticket is missing pipeline or pipeline stage information')
    }

    const pipeline = await this._getTicketPipeline({ nameOrLabel: ticket.properties.hs_pipeline })
    const pipelineStage = this._getTicketPipelineStage({
      nameOrLabel: ticket.properties.hs_pipeline_stage,
      stages: pipeline.stages,
    })

    return {
      ...ticket,
      pipeline,
      pipelineStage,
    }
  }

  @handleErrors('Failed to create contact')
  public async createContact({
    email,
    phone,
    ownerEmailOrId,
    companies,
    ticketIds,
    additionalProperties,
  }: {
    email?: string
    phone?: string
    ownerEmailOrId?: string
    companies?: { idOrNameOrDomain: string; primary?: boolean }[]
    ticketIds?: string[]
    additionalProperties: Record<string, string>
  }) {
    if (!email && !phone) {
      throw new sdk.RuntimeError('Email or phone is required')
    }

    const owner = ownerEmailOrId
      ? ownerEmailOrId.includes('@')
        ? await this._retrieveOwnerByEmail({ email: ownerEmailOrId })
        : { id: ownerEmailOrId }
      : undefined

    const resolvedProperties = await this._resolveAndCoerceProperties({
      properties: additionalProperties,
      type: 'contact',
    })
    const resolvedCompanies = companies
      ? await Promise.all(
          companies.map(async ({ idOrNameOrDomain, primary }) => ({
            ...(await this._searchCompany({ idOrNameOrDomain })),
            primary: primary ?? false,
          }))
        )
      : []

    const resolvedPrimaryCompanies = resolvedCompanies.filter((company) => company.primary)
    const resolvedOtherCompanies = resolvedCompanies.filter((company) => !company.primary)
    const resolvedTickets = await Promise.all((ticketIds ?? []).map((id) => this._getTicket({ id })))

    const newContact = await this._hsClient.crm.contacts.basicApi.create({
      properties: {
        ...resolvedProperties,
        ...(owner ? { hubspot_owner_id: owner.id } : {}),
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
      },
      associations: [
        ...resolvedPrimaryCompanies.map((company) => ({
          to: { id: company.id },
          types: [
            {
              associationCategory: AssociationSpecAssociationCategoryEnum.HubspotDefined,
              associationTypeId: AssociationTypes.primaryContactToCompany,
            },
          ],
        })),
        ...resolvedOtherCompanies.map((company) => ({
          to: { id: company.id },
          types: [
            {
              associationCategory: AssociationSpecAssociationCategoryEnum.HubspotDefined,
              associationTypeId: AssociationTypes.contactToCompany,
            },
          ],
        })),
        ...resolvedTickets.map((ticket) => ({
          to: { id: ticket.id },
          types: [
            {
              associationCategory: AssociationSpecAssociationCategoryEnum.HubspotDefined,
              associationTypeId: AssociationTypes.contactToTicket,
            },
          ],
        })),
      ],
    })

    return newContact
  }

  @handleErrors('Failed to get contact by ID')
  public async getContact({ contactId, propertiesToReturn }: { contactId: string; propertiesToReturn?: string[] }) {
    const allPropertiesToReturn = [...DEFAULT_CONTACT_PROPERTIES, ...(propertiesToReturn ?? [])]
    await this._validateProperties({ properties: allPropertiesToReturn ?? [], type: 'contact' })
    const idProperty = contactId.includes('@') ? 'email' : undefined
    const contact = await this._hsClient.crm.contacts.basicApi.getById(
      contactId,
      allPropertiesToReturn,
      undefined,
      undefined,
      undefined,
      idProperty
    )
    return contact
  }

  @handleErrors('Failed to update contact')
  public async updateContact({
    contactId,
    email,
    phone,
    additionalProperties,
  }: {
    contactId: string
    email?: string
    phone?: string
    additionalProperties: Record<string, string>
  }) {
    const resolvedProperties = await this._resolveAndCoerceProperties({
      properties: additionalProperties,
      type: 'contact',
    })

    const idProperty = contactId.includes('@') ? 'email' : undefined
    const updatedContact = await this._hsClient.crm.contacts.basicApi.update(
      contactId,
      {
        properties: {
          ...resolvedProperties,
          ...(email ? { email } : {}),
          ...(phone ? { phone } : {}),
        },
      },
      idProperty
    )
    return updatedContact
  }

  @handleErrors('Failed to delete contact')
  public async deleteContact({ contactId }: { contactId: string }) {
    await this._hsClient.crm.contacts.basicApi.archive(contactId)
  }

  @handleErrors('Failed to list contacts')
  public async listContacts({ properties, nextToken }: { properties?: string[]; nextToken?: string }) {
    const { results, paging } = await this._hsClient.crm.contacts.basicApi.getPage(PAGING_LIMIT, nextToken, [
      ...DEFAULT_CONTACT_PROPERTIES,
      ...(properties ?? []),
    ])

    return {
      contacts: results,
      nextToken: paging?.next?.after,
    }
  }

  @handleErrors('Failed to create ticket')
  public async createTicket({
    subject,
    category,
    description,
    pipelineNameOrId,
    pipelineStageNameOrId,
    priority,
    ticketOwnerEmailOrId,
    companyIdOrNameOrDomain,
    requesterEmailOrId,
    source,
    additionalProperties,
  }: {
    subject: string
    category?: string
    description?: string
    pipelineNameOrId?: string
    pipelineStageNameOrId?: string
    priority?: string
    ticketOwnerEmailOrId?: string
    companyIdOrNameOrDomain?: string
    requesterEmailOrId?: string
    source?: string
    additionalProperties: Record<string, string>
  }) {
    const resolvedCategory = category
      ? await this._resolveAndCoerceProperty({
          nameOrLabel: 'hs_ticket_category',
          value: category,
          type: 'ticket',
        })
      : undefined

    const resolvedPriority = priority
      ? await this._resolveAndCoerceProperty({
          nameOrLabel: 'hs_ticket_priority',
          value: priority,
          type: 'ticket',
        })
      : undefined

    const resolvedSource = source
      ? await this._resolveAndCoerceProperty({
          nameOrLabel: 'source_type',
          value: source,
          type: 'ticket',
        })
      : undefined

    const pipeline = pipelineNameOrId ? await this._getTicketPipeline({ nameOrLabel: pipelineNameOrId }) : undefined
    const pipelineStage =
      pipelineStageNameOrId && pipeline
        ? this._getTicketPipelineStage({
            nameOrLabel: pipelineStageNameOrId,
            stages: pipeline.stages,
          })
        : undefined

    const resolvedProperties: Record<string, any> = {}

    for (const [nameOrLabel, value] of Object.entries(additionalProperties)) {
      const { propertyName, coercedValue } = await this._resolveAndCoerceProperty({
        nameOrLabel,
        value,
        type: 'ticket',
      })
      resolvedProperties[propertyName] = coercedValue
    }

    const ticketOwner = ticketOwnerEmailOrId
      ? ticketOwnerEmailOrId.includes('@')
        ? await this._retrieveOwnerByEmail({ email: ticketOwnerEmailOrId }).catch(() => {
            throw new sdk.RuntimeError('Unable to find owner for ticket')
          })
        : { id: ticketOwnerEmailOrId }
      : undefined

    const requester = requesterEmailOrId
      ? requesterEmailOrId.includes('@')
        ? await this.searchContact({ email: requesterEmailOrId, propertiesToReturn: [] }).catch(() => {
            throw new sdk.RuntimeError('Unable to find requester contact for ticket')
          })
        : { id: requesterEmailOrId }
      : undefined

    const isCompanyId = companyIdOrNameOrDomain !== '' && !isNaN(Number(companyIdOrNameOrDomain))
    const company = companyIdOrNameOrDomain
      ? isCompanyId
        ? { id: companyIdOrNameOrDomain } // Let hubspot handle invalid IDs
        : await this._searchCompany({ idOrNameOrDomain: companyIdOrNameOrDomain }).catch(() => {
            throw new sdk.RuntimeError('Unable to find company for ticket')
          })
      : undefined

    const ticketCreateInput: Parameters<OfficialHubspotClient['crm']['tickets']['basicApi']['create']>[0] = {
      properties: {
        subject,
        ...(resolvedCategory ? { hs_ticket_category: resolvedCategory.coercedValue.toString() } : {}),
        ...(description ? { content: description } : {}),
        ...(pipeline ? { hs_pipeline: pipeline.id } : {}),
        ...(pipelineStage ? { hs_pipeline_stage: pipelineStage.id } : {}),
        ...(resolvedPriority ? { hs_ticket_priority: resolvedPriority.coercedValue.toString() } : {}),
        ...(resolvedSource ? { source_type: resolvedSource.coercedValue.toString() } : {}),
        ...(ticketOwner ? { hubspot_owner_id: ticketOwner?.id } : {}),
        ...resolvedProperties,
      },
      associations: [
        ...(requester
          ? [
              {
                to: { id: requester.id },
                types: [
                  {
                    associationCategory: AssociationSpecAssociationCategoryEnum.HubspotDefined,
                    associationTypeId: AssociationTypes.ticketToContact,
                  },
                ],
              },
            ]
          : []),
        ...(company
          ? [
              {
                to: { id: company.id },
                types: [
                  {
                    associationCategory: AssociationSpecAssociationCategoryEnum.HubspotDefined,
                    associationTypeId: AssociationTypes.primaryTicketToCompany,
                  },
                ],
              },
            ]
          : []),
      ],
    }

    return await this._hsClient.crm.tickets.basicApi.create(ticketCreateInput)
  }

  @handleErrors('Failed to search deal')
  public async searchDeal({ name, propertiesToReturn }: { name?: string; propertiesToReturn?: string[] }) {
    const filters = []

    if (name) {
      filters.push({
        propertyName: 'dealname',
        operator: DealFilterOperator.Eq,
        value: name,
      })
    }

    if (!filters.length) {
      throw new Error('No filters provided')
    }

    const deals = await this._hsClient.crm.deals.searchApi.doSearch({
      filterGroups: [
        {
          filters,
        },
      ],
      properties: [...DEFAULT_DEAL_PROPERTIES, ...(propertiesToReturn ?? [])],
    })

    const deal = deals.results[0]

    if (!deal) {
      throw new sdk.RuntimeError('Unable to find deal')
    }

    return deal
  }

  @handleErrors('Failed to get deal')
  public async getDealById({ dealId, propertiesToReturn }: { dealId: string; propertiesToReturn?: string[] }) {
    const deal = await this._hsClient.crm.deals.basicApi.getById(dealId, [
      // Builtin properties normally returned by API
      ...DEFAULT_DEAL_PROPERTIES,
      ...(propertiesToReturn ?? []),
    ])

    return deal
  }

  @handleErrors('Failed to delete deal')
  public async deleteDealById({ dealId }: { dealId: string }) {
    await this._hsClient.crm.deals.basicApi.archive(dealId)
  }

  @handleErrors('Failed to update deal')
  public async updateDealById({
    dealId,
    name,
    properties,
  }: {
    dealId: string
    name?: string
    properties: Record<string, string>
  }) {
    const resolvedProperties = await this._resolveAndCoerceProperties({ properties, type: 'deal' })

    const deal = await this._hsClient.crm.deals.basicApi.update(dealId, {
      properties: {
        ...resolvedProperties,
        ...(name ? { dealname: name } : {}),
      },
    })

    return deal
  }

  @handleErrors('Failed to create deal')
  public async createDeal({ name, properties }: { name: string; properties: Record<string, string> }) {
    const resolvedProperties = await this._resolveAndCoerceProperties({ properties, type: 'deal' })
    const deal = await this._hsClient.crm.deals.basicApi.create({
      properties: {
        ...resolvedProperties,
        ...(name ? { dealname: name } : {}),
      },
    })

    return deal
  }

  @handleErrors('Failed to create lead')
  public async createLead({
    name,
    properties,
    contactEmailOrId,
  }: {
    name: string
    properties: Record<string, string>
    contactEmailOrId?: string
  }) {
    const contact = contactEmailOrId ? await this.getContact({ contactId: contactEmailOrId }) : undefined
    const resolvedProperties = await this._resolveAndCoerceProperties({ properties, type: 'lead' })
    const lead = await this._hsClient.crm.objects.leads.basicApi.create({
      properties: {
        ...resolvedProperties,
        ...(name ? { hs_lead_name: name } : {}),
      },
      associations: contact
        ? [
            {
              to: { id: contact.id },
              types: [
                {
                  associationCategory: AssociationSpecAssociationCategoryEnum.HubspotDefined,
                  associationTypeId: 578, // lead to primary contact
                },
              ],
            },
          ]
        : [],
    })

    return lead
  }

  @handleErrors('Failed to get lead')
  public async getLeadById({ leadId, propertiesToReturn }: { leadId: string; propertiesToReturn?: string[] }) {
    const lead = await this._hsClient.crm.objects.leads.basicApi.getById(leadId, [
      ...DEFAULT_LEAD_PROPERTIES,
      ...(propertiesToReturn ?? []),
    ])
    return lead
  }

  @handleErrors('Failed to delete lead')
  public async deleteLead({ leadId }: { leadId: string }) {
    await this._hsClient.crm.objects.leads.basicApi.archive(leadId)
  }

  @handleErrors('Failed to update lead')
  public async updateLead({
    leadId,
    name,
    properties,
  }: {
    leadId: string
    name?: string
    properties: Record<string, string>
  }) {
    const resolvedProperties = await this._resolveAndCoerceProperties({ properties, type: 'lead' })

    const lead = await this._hsClient.crm.objects.leads.basicApi.update(leadId, {
      properties: {
        ...resolvedProperties,
        ...(name ? { hs_lead_name: name } : {}),
      },
    })

    return lead
  }

  @handleErrors('Failed to search lead')
  public async searchLead({ name, propertiesToReturn }: { name?: string; propertiesToReturn?: string[] }) {
    const filters = []

    if (name) {
      filters.push({
        propertyName: 'hs_lead_name',
        operator: LeadFilterOperator.Eq,
        value: name,
      })
    }

    if (!filters.length) {
      throw new Error('No filters provided')
    }

    const leads = await this._hsClient.crm.objects.leads.searchApi.doSearch({
      filterGroups: [
        {
          filters,
        },
      ],
      properties: [...DEFAULT_LEAD_PROPERTIES, ...(propertiesToReturn ?? [])],
    })

    const lead = leads.results[0]

    if (!lead) {
      throw new sdk.RuntimeError('Unable to find lead')
    }

    return lead
  }

  @handleErrors('Failed to validate properties')
  private async _validateProperties({ properties, type }: { properties: string[]; type: CrmObjectType }) {
    const unknownProperties: string[] = []
    for (const property of properties) {
      await this._crmObjectPropertiesCaches[type].getProperty({ nameOrLabel: property }).catch(() => {
        unknownProperties.push(property)
      })
    }
    if (unknownProperties.length) {
      throw new sdk.RuntimeError(`Unknown properties: ${unknownProperties.join(', ')}`)
    }
  }

  private async _resolveAndCoerceProperties({
    properties,
    type,
  }: {
    properties: Record<string, string>
    type: CrmObjectType
  }): Promise<Record<string, any>> {
    const resolvedProperties: Record<string, any> = {}
    for (const [nameOrLabel, value] of Object.entries(properties)) {
      const { propertyName, coercedValue } = await this._resolveAndCoerceProperty({ nameOrLabel, value, type })
      resolvedProperties[propertyName] = coercedValue
    }
    return resolvedProperties
  }

  @handleErrors('Failed to resolve and coerce property')
  private async _resolveAndCoerceProperty({
    nameOrLabel,
    value,
    type,
  }: {
    nameOrLabel: string
    value: string
    type: CrmObjectType
  }): Promise<{
    propertyName: string
    coercedValue: boolean | number | string
  }> {
    const propertiesCache = this._crmObjectPropertiesCaches[type]
    const property = await propertiesCache.getProperty({ nameOrLabel })
    switch (property.type) {
      case 'bool':
        if (['true', '1', 'yes'].includes(value.trim().toLowerCase())) {
          return { propertyName: property.name, coercedValue: true }
        } else if (['false', '0', 'no'].includes(value.trim().toLowerCase())) {
          return { propertyName: property.name, coercedValue: false }
        } else {
          throw new sdk.RuntimeError(`Unable to coerce value "${value}" to boolean for property "${nameOrLabel}"`)
        }
      case 'number':
        const asNumber = Number(value)
        if (isNaN(asNumber)) {
          throw new sdk.RuntimeError(`Unable to coerce value "${value}" to number for property "${nameOrLabel}"`)
        }
        return { propertyName: property.name, coercedValue: asNumber }
      case 'date':
      case 'datetime':
        const asDate = new Date(value)
        if (isNaN(asDate.getTime())) {
          throw new sdk.RuntimeError(`Unable to coerce value "${value}" to date for property "${nameOrLabel}"`)
        }
        return { propertyName: property.name, coercedValue: asDate.toISOString() }
      case 'enumeration':
        if (property.options && !property.options.includes(value)) {
          propertiesCache.invalidate()
          const refreshedProperty = await propertiesCache.getProperty({ nameOrLabel })
          // Check if options have been updated since last refresh
          if (refreshedProperty.options && !refreshedProperty.options.includes(value)) {
            throw new sdk.RuntimeError(
              `Unable to coerce value "${value}" to enumeration for property "${nameOrLabel}", valid options are ${refreshedProperty.options.join(', ')}`
            )
          }
        }
        return { propertyName: property.name, coercedValue: value }
      case 'string':
      case 'object_coordinates':
      case 'json':
      case 'phone_number':
        return { propertyName: property.name, coercedValue: value }
      default:
        property.type satisfies never
        throw new sdk.RuntimeError(
          `Property "${nameOrLabel}" has unsupported type "${property.type}". Supported types are: bool, number, date, datetime, enumeration, string, object_coordinates, json`
        )
    }
  }

  @handleErrors('Failed to search company')
  private async _searchCompany({ idOrNameOrDomain }: { idOrNameOrDomain: string }) {
    const canonicalInput = idOrNameOrDomain.trim()

    const isNumeric = canonicalInput !== '' && !isNaN(Number(canonicalInput))

    if (isNumeric) {
      const company = await this._hsClient.crm.companies.basicApi.getById(canonicalInput, [
        'hs_object_id',
        'name',
        'domain',
      ])
      return company
    }

    const companies = await this._hsClient.crm.companies.searchApi.doSearch({
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'name',
              operator: ContactFilterOperator.Eq,
              value: idOrNameOrDomain,
            },
          ],
        },
        {
          filters: [
            {
              propertyName: 'domain',
              operator: ContactFilterOperator.Eq,
              value: idOrNameOrDomain,
            },
          ],
        },
      ],
      properties: ['hs_object_id', 'name', 'domain'],
      limit: 2, // We only need to know if there's exactly one match
    })

    if (companies.total > 1) {
      throw new sdk.RuntimeError(`Multiple companies found matching "${idOrNameOrDomain}"`)
    }

    const matchingCompany = companies.results[0]

    if (!matchingCompany) {
      throw new sdk.RuntimeError(`No company found matching "${idOrNameOrDomain}"`)
    }

    return matchingCompany
  }

  @handleErrors('Failed to get ticket pipeline')
  private async _getTicketPipeline({ nameOrLabel }: { nameOrLabel: string }) {
    const canonicalName = _getCanonicalName(nameOrLabel)

    const knownTicketPipelines = await this._getTicketPipelinesCache()

    let matchingPipeline = knownTicketPipelines[nameOrLabel]
      ? ([nameOrLabel, knownTicketPipelines[nameOrLabel]] as const)
      : undefined
    matchingPipeline ??= Object.entries(knownTicketPipelines).find(
      ([id, { label }]) =>
        _getCanonicalName(id) === canonicalName ||
        _getCanonicalName(label) === canonicalName ||
        _getCanonicalName(label) === `${canonicalName} PIPELINE` // Hubspot often appends "Pipeline" to the label in the UI
    )

    if (!matchingPipeline) {
      // Refresh, then do a second pass:
      await this._refreshTicketPipelinesFromApi()

      matchingPipeline = this._ticketPipelines![nameOrLabel]
        ? ([nameOrLabel, this._ticketPipelines![nameOrLabel]] as const)
        : undefined
      matchingPipeline ??= Object.entries(this._ticketPipelines!).find(
        ([id, { label }]) =>
          _getCanonicalName(id) === canonicalName ||
          _getCanonicalName(label) === canonicalName ||
          _getCanonicalName(label) === `${canonicalName} PIPELINE` // Hubspot often appends "Pipeline" to the label in the UI
      )

      if (!matchingPipeline) {
        // At this point, we give up:
        throw new sdk.RuntimeError(`Unable to find ticket pipeline with name or id "${nameOrLabel}"`)
      }
    }

    return {
      id: matchingPipeline[0],
      label: matchingPipeline[1].label,
      stages: matchingPipeline[1].stages,
    }
  }

  private _getTicketPipelineStage({
    nameOrLabel,
    stages,
  }: {
    nameOrLabel: string
    stages: Record<string, { label: string }>
  }) {
    const canonicalName = _getCanonicalName(nameOrLabel)

    const matchingStage = Object.entries(stages).find(
      ([id, { label }]) =>
        _getCanonicalName(id) === canonicalName ||
        _getCanonicalName(label) === canonicalName ||
        // Stages show up as "Label (Pipeline Name)" in the UI, so we strip the pipeline name part:
        _getCanonicalName(label) === canonicalName.split('(')[0]?.trim()
    )

    if (!matchingStage) {
      throw new sdk.RuntimeError(`Unable to find ticket pipeline stage with name or id "${nameOrLabel}"`)
    }

    return {
      id: matchingStage[0],
      label: matchingStage[1].label,
    }
  }

  @handleErrors('Failed to get ticket pipelines cache')
  private async _getTicketPipelinesCache(): Promise<TicketPipelinesCache> {
    if (!this._ticketPipelines) {
      try {
        const { state } = await this._client.getState({
          type: 'integration',
          id: this._ctx.integrationId,
          name: 'ticketPipelineCache',
        })

        this._ticketPipelines = state.payload.pipelines
      } catch {
        await this._refreshTicketPipelinesFromApi()
      }
    }

    if (!this._ticketPipelines) {
      throw new sdk.RuntimeError('Could not get ticket pipelines cache')
    }

    return this._ticketPipelines
  }

  @handleErrors('Failed to retrieve ticket pipelines from HubSpot API')
  private async _refreshTicketPipelinesFromApi(): Promise<void> {
    if (this._ticketPipelinesAlreadyRefreshed) {
      // Prevent refreshing several times in a single lambda invocation
      return
    }

    const pipelines = await this._hsClient.crm.pipelines.pipelinesApi.getAll('ticket')
    this._ticketPipelines = Object.fromEntries(
      pipelines.results.map(
        (prop) =>
          [
            prop.id,
            {
              label: prop.label,
              stages: Object.fromEntries(
                prop.stages.map((stage) => [
                  stage.id,
                  {
                    label: stage.label,
                  },
                ])
              ),
            } satisfies TicketPipeline,
          ] as const
      )
    )

    await this._client.setState({
      type: 'integration',
      id: this._ctx.integrationId,
      name: 'ticketPipelineCache',
      payload: { pipelines: this._ticketPipelines },
    })

    this._ticketPipelinesAlreadyRefreshed = true
  }

  @handleErrors('Failed to retrieve owner by email')
  private async _retrieveOwnerByEmail({ email }: { email: string }) {
    const canonicalEmail = _getCanonicalName(email)
    const owners = await this._hsClient.crm.owners.ownersApi.getPage(email, undefined, 1, false)
    const matchingOwner = owners.results.find((owner) => _getCanonicalName(owner.email ?? '') === canonicalEmail)

    if (!matchingOwner) {
      throw new sdk.RuntimeError(`Unable to find owner with email "${email}"`)
    }

    return matchingOwner
  }

  @handleErrors('Failed to get ticket')
  private async _getTicket({ id }: { id: string }) {
    const ticket = await this._hsClient.crm.tickets.basicApi.getById(id)
    return ticket
  }
}

const _getCanonicalName = (name: string) => name.trim().toUpperCase()
