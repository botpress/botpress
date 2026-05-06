import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'
import { OdooAPI } from './odoo-api/OdooAPI'

const createOdooApi = (props: bp.AnyActionProps): OdooAPI =>
  new OdooAPI(props.ctx.configuration.url, props.ctx.configuration.apiKey, props.ctx.configuration.database)

export default new bp.Integration({
  register: async (props) => {
    props.logger
      .forBot()
      .info(
        `register called with url=${props.ctx.configuration.url}, database=${props.ctx.configuration.database}, apiKey=${props.ctx.configuration.apiKey}`
      )

    /**
     * This is called when an integration configuration is saved.
     * You should use this handler to instanciate ressources in the external service and ensure that the configuration is valid.
     */
    // throw new sdk.RuntimeError('Invalid configuration') // replace this with your own validation logic
  },
  unregister: async () => {
    /**
     * This is called when a bot removes the integration.
     * You should use this handler to instanciate ressources in the external service and ensure that the configuration is valid.
     */
    // throw new sdk.RuntimeError('Invalid configuration') // replace this with your own validation logic
  },
  actions: {
    getContactFields: async (props) => {
      const fields = await createOdooApi(props).getFields('Contact', props.input)

      return { fields }
    },
    searchContacts: async (props) => {
      const records = await createOdooApi(props).searchContacts(props.input)

      return { records }
    },
    getContacts: async (props) => {
      const records = await createOdooApi(props).getContacts(props.input)

      return { records }
    },
    createContact: async (props) => {
      const id = await createOdooApi(props).createContact(props.input)

      return { id }
    },
    updateContacts: async (props) => {
      const success = await createOdooApi(props).updateContacts(props.input)

      return { success }
    },
    deleteContacts: async (props) => {
      const success = await createOdooApi(props).deleteContacts(props.input)

      return { success }
    },
  },
  channels: {},
  handler: async () => {},
})
