import { BaseInterface } from '../../interface'

/**
 * Used by a bot to tell the plugin what integration should be used to implement an interface.
 */
export type PluginInterfaceExtension<TInterface extends BaseInterface = BaseInterface> = {
  id?: string // id of the integration to use
  name: string // name of the integration to use
  version: string // version of the integration to use
  entities: { [K in keyof TInterface['entities']]: { name: string } }
  actions: { [K in keyof TInterface['actions']]: { name: string } }
  events: { [K in keyof TInterface['events']]: { name: string } }
  channels: { [K in keyof TInterface['channels']]: { name: string } }
}
