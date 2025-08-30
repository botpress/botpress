import * as sdk from '@botpress/sdk'
import { Client as _HubspotClient } from '@hubspot/api-client'
import * as bp from '.botpress'

type TicketPropertiesCache = bp.states.States['ticketPropertyCache']['payload']['properties']
type TicketProperty = TicketPropertiesCache[string]
type TicketPipelinesCache = bp.states.States['ticketPipelineCache']['payload']['pipelines']
type TicketPipeline = TicketPipelinesCache[string]

export class HubspotClient {
  private readonly _hsClient: _HubspotClient
  private readonly _client: bp.Client
  private readonly _ctx: bp.Context
  private _ticketProperties: TicketPropertiesCache | undefined
  private _ticketPropertiesAlreadyRefreshed: boolean = false
  private _ticketPipelines: TicketPipelinesCache | undefined
  private _ticketPipelinesAlreadyRefreshed: boolean = false

  public constructor({ accessToken, client, ctx }: { accessToken: string; client: bp.Client; ctx: bp.Context }) {
    this._client = client
    this._ctx = ctx
    this._hsClient = new _HubspotClient({ accessToken })
  }

  public async createTicket({
    subject,
    category,
    description,
    pipelineNameOrId,
    pipelineStageNameOrId,
    priority,
    ticketOwnerEmailOrId,
    linearTicketUrl,
    source,
    additionalProperties,
  }: {
    subject: string
    category?: 'Product Issue' | 'Billing Issue' | 'Feature Request' | 'General Inquiry'
    description?: string
    pipelineNameOrId: string
    pipelineStageNameOrId: string
    priority?: 'Low' | 'Medium' | 'High' | 'Urgent'
    ticketOwnerEmailOrId?: string
    linearTicketUrl?: string
    source?: 'Zoom' | 'Email' | 'Phone' | 'Chat' | 'Form'
    additionalProperties: Record<string, string>
  }) {
    const pipeline = await this._getTicketPipeline({ nameOrLabel: pipelineNameOrId })
    const pipelineStage = this._getTicketPipelineStage({
      nameOrLabel: pipelineStageNameOrId,
      stages: pipeline.stages,
    })

    const resolvedProperties: Record<string, any> = {}

    for (const [nameOrLabel, value] of Object.entries(additionalProperties)) {
      const property = await this._getTicketProperty({ nameOrLabel })

      // Type coercion based on property type:
      switch (property.type) {
        case 'bool':
          if (['true', '1', 'yes'].includes(value.trim().toLowerCase())) {
            resolvedProperties[property.name] = true
          } else if (['false', '0', 'no'].includes(value.trim().toLowerCase())) {
            resolvedProperties[property.name] = false
          } else {
            throw new sdk.RuntimeError(`Unable to coerce value "${value}" to boolean for property "${nameOrLabel}"`)
          }
          break
        case 'number':
          const asNumber = Number(value)
          if (isNaN(asNumber)) {
            throw new sdk.RuntimeError(`Unable to coerce value "${value}" to number for property "${nameOrLabel}"`)
          }
          resolvedProperties[property.name] = asNumber
          break
        case 'date':
        case 'datetime':
          const asDate = new Date(value)
          if (isNaN(asDate.getTime())) {
            throw new sdk.RuntimeError(`Unable to coerce value "${value}" to date for property "${nameOrLabel}"`)
          }
          resolvedProperties[property.name] = asDate.toISOString()
          break
        case 'enumeration':
        case 'string':
        case 'object_coordinates':
        case 'json':
          resolvedProperties[property.name] = value
          break
        default:
          property.type satisfies never
          throw new sdk.RuntimeError(
            `Property "${nameOrLabel}" has unsupported type "${property.type}". Supported types are: bool, number, date, datetime, enumeration, string, object_coordinates, json`
          )
      }
    }

    // TODO: resolve ticket owner by email or id

    const newTicket = await this._hsClient.crm.tickets.basicApi.create({
      properties: {
        subject,
        ...(category ? { hs_ticket_category: category } : {}),
        ...(description ? { content: description } : {}),
        hs_pipeline: pipeline.id,
        hs_pipeline_stage: pipelineStage.id,
        ...(priority ? { hs_ticket_priority: priority } : {}),
        ...(source ? { source_type: source } : {}),
        ...(linearTicketUrl ? { linear_ticket: linearTicketUrl } : {}),
        // TODO: ticket owner
        ...resolvedProperties,
      },
    })

    return { ticketId: newTicket.id }
  }

  private async _getTicketProperty({ nameOrLabel }: { nameOrLabel: string }) {
    const canonicalName = _getCanonicalName(nameOrLabel)

    const knownTicketProperties = await this._getTicketPropertiesCache()
    let matchingProperty = Object.entries(knownTicketProperties).find(
      ([name, { label }]) => _getCanonicalName(name) === canonicalName || _getCanonicalName(label) === canonicalName
    )

    if (!matchingProperty) {
      // Refresh, then do a second pass:
      await this._refreshTicketPropertiesFromApi()

      matchingProperty = Object.entries(this._ticketProperties!).find(
        ([name, { label }]) => _getCanonicalName(name) === canonicalName || _getCanonicalName(label) === canonicalName
      )

      if (!matchingProperty) {
        // At this point, we give up:
        throw new sdk.RuntimeError(`Unable to find ticket property with name "${nameOrLabel}"`)
      }
    }

    return {
      name: matchingProperty[0],
      type: matchingProperty[1].type,
    }
  }

  private async _getTicketPropertiesCache(): Promise<TicketPropertiesCache> {
    if (!this._ticketProperties) {
      try {
        const { state } = await this._client.getState({
          type: 'integration',
          id: this._ctx.integrationId,
          name: 'ticketPropertyCache',
        })

        this._ticketProperties = state.payload.properties
      } catch {
        await this._refreshTicketPropertiesFromApi()
      }
    }

    return this._ticketProperties as TicketPropertiesCache
  }

  private async _refreshTicketPropertiesFromApi(): Promise<void> {
    if (this._ticketPropertiesAlreadyRefreshed) {
      // Prevent refreshing several times in a single lambda invocation
      return
    }

    const properties = await this._hsClient.crm.properties.coreApi.getAll('ticket', false)
    this._ticketProperties = Object.fromEntries(
      properties.results.map(
        (prop) =>
          [
            prop.name,
            {
              label: prop.label,
              type: prop.type as TicketPropertiesCache[string]['type'],
              hubspotDefined: prop.hubspotDefined ?? false,
            } satisfies TicketProperty,
          ] as const
      )
    )

    this._client.setState({
      type: 'integration',
      id: this._ctx.integrationId,
      name: 'ticketPropertyCache',
      payload: { properties: this._ticketProperties },
    })

    this._ticketPropertiesAlreadyRefreshed = true
  }

  private async _getTicketPipeline({ nameOrLabel }: { nameOrLabel: string }) {
    const canonicalName = _getCanonicalName(nameOrLabel)

    const knownTicketPipelines = await this._getTicketPipelinesCache()
    let matchingPipeline = Object.entries(knownTicketPipelines).find(
      ([id, { label }]) =>
        _getCanonicalName(id) === canonicalName ||
        _getCanonicalName(label) === canonicalName ||
        _getCanonicalName(label) === `${canonicalName} PIPELINE` // Hubspot often appends "Pipeline" to the label in the UI
    )

    if (!matchingPipeline) {
      // Refresh, then do a second pass:
      await this._refreshTicketPipelinesFromApi()

      matchingPipeline = Object.entries(this._ticketPipelines!).find(
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
      ([id, { label }]) => _getCanonicalName(id) === canonicalName || _getCanonicalName(label) === canonicalName
    )

    if (!matchingStage) {
      throw new sdk.RuntimeError(`Unable to find ticket pipeline stage with name or id "${nameOrLabel}"`)
    }

    return {
      id: matchingStage[0],
    }
  }

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

    return this._ticketPipelines as TicketPipelinesCache
  }

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

    this._client.setState({
      type: 'integration',
      id: this._ctx.integrationId,
      name: 'ticketPipelineCache',
      payload: { pipelines: this._ticketPipelines },
    })

    this._ticketPipelinesAlreadyRefreshed = true
  }
}

const _getCanonicalName = (name: string) => name.trim().toUpperCase()
