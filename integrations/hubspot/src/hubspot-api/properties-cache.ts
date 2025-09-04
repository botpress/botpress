import { RuntimeError } from '@botpress/sdk'
import { Client as OfficialHubspotClient } from '@hubspot/api-client'
import { propertyTypesSchema } from '../../definitions/states'
import * as bp from '.botpress'

type TCrmObject = 'ticket' | 'contact' | 'deal' | 'lead' // TODO: Infer from the Hubspot API client or definition
type TSetStatePayloadCallback = (state: bp.states.States[`${TCrmObject}PropertyCache`]['payload']) => Promise<void>
type TProperties = NonNullable<bp.states.States[`${TCrmObject}PropertyCache`]['payload']['properties']>
type TProperty = TProperties[string]

// TODO: Infer types from the state definition and make it generic
export class PropertiesCache {
  private readonly _client: bp.Client
  private readonly _ctx: bp.Context
  private readonly _hsClient: OfficialHubspotClient
  private readonly _type: TCrmObject
  private _properties?: TProperties
  private readonly _setStateCallback: TSetStatePayloadCallback
  private _forceRefresh: boolean = false
  private _alreadyRefreshed: boolean = false

  public constructor({
    client,
    ctx,
    accessToken,
    type,
    setStateCallback,
  }: {
    client: bp.Client
    ctx: bp.Context
    accessToken: string
    type: TCrmObject
    setStateCallback: TSetStatePayloadCallback
  }) {
    this._client = client
    this._ctx = ctx
    this._type = type
    this._hsClient = new OfficialHubspotClient({ accessToken, numberOfApiCallRetries: 2 })
    this._setStateCallback = setStateCallback
  }

  public async getProperty({ nameOrLabel }: { nameOrLabel: string }) {
    const knownProperties = await this._getPropertiesOrRefresh()

    let property = this._resolveProperty(nameOrLabel, knownProperties)
    if (!property || this._forceRefresh) {
      // Refresh, then do a second pass
      await this._refreshPropertiesFromApi()
      property = this._resolveProperty(nameOrLabel, await this._getPropertiesOrRefresh())
      if (!property) {
        // At this point, we give up
        throw new RuntimeError(`Unable to find ${this._type} property with name or label "${nameOrLabel}"`)
      }
    }

    return property
  }

  public invalidate() {
    this._forceRefresh = true
  }

  private _propertiesRecordToNormalizedArray(properties: TProperties) {
    return Object.entries(properties).map(([name, property]) => ({ name, ...property }))
  }

  private _resolveProperty(nameOrLabel: string, properties: TProperties) {
    const normalizedProperties = this._propertiesRecordToNormalizedArray(properties)
    return normalizedProperties.find((property) => {
      if (property.name === nameOrLabel || property.label === nameOrLabel) {
        return property
      }
      const canonicalName = this._getCanonicalName(nameOrLabel)
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
        const parseResult = propertyTypesSchema.safeParse(prop.type) // TODO: Make sure this will work for all CRM objects (if they don't all have the same types)
        if (!parseResult.success) {
          throw new RuntimeError(`Invalid property type "${prop.type}" for ${this._type} property "${prop.label}"`)
        }
        const propFields: TProperty = {
          label: prop.label,
          type: parseResult.data,
          hubspotDefined: prop.hubspotDefined ?? false,
        }
        if (prop.options) {
          propFields['options'] = prop.options.map((option) => option.value)
        }
        return [prop.name, propFields] as const
      })
    )

    await this._client.setState({
      type: 'integration',
      id: this._ctx.integrationId,
      name: `${this._type}PropertyCache`,
      payload: { properties: this._properties },
    })

    this._alreadyRefreshed = true
    this._forceRefresh = false
  }

  private _getCanonicalName(nameOrLabel: string) {
    return nameOrLabel.trim().toUpperCase()
  }
}
