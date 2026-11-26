import { RuntimeError } from '@botpress/sdk'
import { Client as OfficialHubspotClient } from '@hubspot/api-client'
import { CrmObjectType, propertyTypeSchema } from '../../definitions/states'
import { handleErrorsDecorator as handleErrors } from './error-handling'
import * as bp from '.botpress'

type Properties = NonNullable<bp.states.States[`${CrmObjectType}PropertyCache`]['payload']['properties']>
type Property = Properties[string]

export class PropertiesCache {
  private readonly _client: bp.Client
  private readonly _ctx: bp.Context
  private readonly _hsClient: OfficialHubspotClient
  private readonly _type: CrmObjectType
  private _properties?: Properties
  private _forceRefresh: boolean = false
  private _alreadyRefreshed: boolean = false

  public constructor({
    client,
    ctx,
    accessToken,
    type,
  }: {
    client: bp.Client
    ctx: bp.Context
    accessToken: string
    type: CrmObjectType
  }) {
    this._client = client
    this._ctx = ctx
    this._type = type
    this._hsClient = new OfficialHubspotClient({ accessToken, numberOfApiCallRetries: 2 })
  }

  public static create({
    client,
    ctx,
    accessToken,
    type,
  }: {
    client: bp.Client
    ctx: bp.Context
    accessToken: string
    type: CrmObjectType
  }) {
    return new PropertiesCache({ client, ctx, accessToken, type })
  }

  public async getProperty({ nameOrLabel }: { nameOrLabel: string }) {
    const property = await this.findProperty({ nameOrLabel })
    if (!property) {
      throw new RuntimeError(`Unable to find ${this._type} property with name or label "${nameOrLabel}"`)
    }
    return property
  }

  /** Resolves to `undefined` when the property doesn't exist, and rejects when the properties can't be loaded. */
  @handleErrors('Failed to load HubSpot properties')
  public async findProperty({ nameOrLabel }: { nameOrLabel: string }) {
    const knownProperties = await this._getPropertiesOrRefresh()

    const property = this._resolveProperty(nameOrLabel, knownProperties)
    if (property && !this._forceRefresh) {
      return property
    }

    // Refresh, then do a second pass
    await this._refreshPropertiesFromApi()
    return this._resolveProperty(nameOrLabel, await this._getPropertiesOrRefresh())
  }

  public invalidate() {
    this._forceRefresh = true
  }

  private _resolveProperty(nameOrLabel: string, properties: Properties) {
    const normalizedProperties = _propertiesRecordToNormalizedArray(properties)
    return normalizedProperties.find((property) => {
      if (property.name === nameOrLabel || property.label === nameOrLabel) {
        return property
      }
      const canonicalName = _getCanonicalName(nameOrLabel)
      return property.name === canonicalName || property.label === canonicalName
    })
  }

  private async _getPropertiesOrRefresh() {
    if (!this._properties) {
      try {
        const { state } = await this._client.getState({
          type: 'integration',
          id: this._ctx.integrationId,
          name: `${this._type}PropertyCache`,
        })
        this._properties = state.payload.properties
      } catch {
        await this._refreshPropertiesFromApi()
      }
    }

    if (!this._properties) {
      throw new RuntimeError('Could not update properties cache')
    }

    return this._properties
  }

  private async _refreshPropertiesFromApi() {
    if (this._alreadyRefreshed && !this._forceRefresh) {
      // Prevent refreshing several times in a single lambda invocation
      return
    }

    const properties = await this._hsClient.crm.properties.coreApi.getAll(this._type, false)
    this._properties = Object.fromEntries(
      properties.results.map((prop) => {
        const parseResult = propertyTypeSchema.safeParse(prop.type)
        if (!parseResult.success) {
          throw new RuntimeError(`Invalid property type "${prop.type}" for ${this._type} property "${prop.label}"`)
        }
        // Only what property resolution and coercion read is cached, so the state stays under the size limit
        const propFields: Property = {
          label: prop.label,
          type: parseResult.data,
        }
        if (prop.options?.length) {
          propFields['options'] = prop.options.map((option) => option.value)
        }
        return [prop.name, propFields] as const
      })
    )

    this._alreadyRefreshed = true
    this._forceRefresh = false

    // A portal with a very large number of properties can still go over the state size limit. The properties are
    // already in memory for this invocation, so a failed save only means the next invocation fetches them again.
    await this._client
      .setState({
        type: 'integration',
        id: this._ctx.integrationId,
        name: `${this._type}PropertyCache`,
        payload: { properties: this._properties },
      })
      .catch((thrown: unknown) => {
        console.warn(`Failed to save the ${this._type} properties cache, they will be fetched again next time`, thrown)
      })
  }
}

const _propertiesRecordToNormalizedArray = (properties: Properties) => {
  return Object.entries(properties).map(([name, property]) => ({ name, ...property }))
}

const _getCanonicalName = (nameOrLabel: string) => nameOrLabel.trim().toUpperCase()
