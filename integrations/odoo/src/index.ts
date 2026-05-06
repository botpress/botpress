import * as sdk from '@botpress/sdk'
import { OdooAPI } from './odoo-api/OdooAPI'
import * as bp from '.botpress'

const createOdooApi = (props: bp.AnyActionProps): OdooAPI =>
  new OdooAPI(props.ctx.configuration.url, props.ctx.configuration.apiKey, props.ctx.configuration.database)

type NotDeletedContact = {
  id: number
  name?: string
  reason: string
}

const getErrorMessage = (thrown: unknown): string => (thrown instanceof Error ? thrown.message : String(thrown))

const createOdooRuntimeError = (thrown: unknown): sdk.RuntimeError => {
  const message = getErrorMessage(thrown)
  const invalidFieldMatch = /Invalid field '([^']+)' on '([^']+)'/.exec(message)

  if (invalidFieldMatch) {
    const [, field, model] = invalidFieldMatch

    return new sdk.RuntimeError(
      `Invalid Odoo field "${field}" for model "${model}". Remove this field from the request or call getContactFields to see the available contact fields for this Odoo database.`
    )
  }

  return new sdk.RuntimeError(message)
}

const isActiveUserLinkedContactError = (message: string): boolean =>
  message.includes('You cannot delete contacts linked to an active user')

const getContactOwnerId = (contact: Record<string, unknown>): number | undefined => {
  const owner = contact.user_id

  if (Array.isArray(owner) && typeof owner[0] === 'number') {
    return owner[0]
  }

  if (typeof owner === 'number') {
    return owner
  }

  return undefined
}

const getContactName = (contact: Record<string, unknown>): string | undefined =>
  typeof contact.name === 'string' ? contact.name : undefined

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
    getCurrentUser: async (props) => {
      try {
        const id = await createOdooApi(props).getCurrentUserId()

        return { id }
      } catch (thrown) {
        throw createOdooRuntimeError(thrown)
      }
    },
    getContactFields: async (props) => {
      const fields = await createOdooApi(props).getFields('Contact', props.input)

      return { fields }
    },
    searchContacts: async (props) => {
      try {
        const records = await createOdooApi(props).searchContacts(props.input)

        return { records }
      } catch (thrown) {
        throw createOdooRuntimeError(thrown)
      }
    },
    getContacts: async (props) => {
      try {
        const records = await createOdooApi(props).getContacts(props.input)

        return { records }
      } catch (thrown) {
        throw createOdooRuntimeError(thrown)
      }
    },
    createContact: async (props) => {
      try {
        const id = await createOdooApi(props).createContact(props.input)

        return { id }
      } catch (thrown) {
        throw createOdooRuntimeError(thrown)
      }
    },
    updateContacts: async (props) => {
      try {
        const success = await createOdooApi(props).updateContacts(props.input)

        return { success }
      } catch (thrown) {
        throw createOdooRuntimeError(thrown)
      }
    },
    deleteContacts: async (props) => {
      const odooApi = createOdooApi(props)
      const contacts = await odooApi.getContacts({
        ids: props.input.ids,
        fields: ['id', 'name', 'user_id'],
        context: props.input.context,
      })
      const contactsById = new Map(contacts.flatMap((contact) => (typeof contact.id === 'number' ? [[contact.id, contact]] : [])))
      const deletedIds: number[] = []
      const notDeletedContacts: NotDeletedContact[] = []

      for (const id of props.input.ids) {
        const contact = contactsById.get(id)

        if (!contact) {
          notDeletedContacts.push({ id, reason: 'Contact was not found in Odoo.' })
          continue
        }

        const name = getContactName(contact)
        const ownerId = getContactOwnerId(contact)

        if (ownerId !== props.input.ownerId) {
          notDeletedContacts.push({
            id,
            name,
            reason:
              ownerId === undefined
                ? 'Contact is not assigned to an owner.'
                : `Contact is owned by Odoo user ${ownerId}, not Odoo user ${props.input.ownerId}.`,
          })
          continue
        }

        try {
          const success = await odooApi.deleteContacts({ ids: [id], context: props.input.context })

          if (success) {
            deletedIds.push(id)
          } else {
            notDeletedContacts.push({ id, name, reason: 'Odoo did not accept the contact deletion.' })
          }
        } catch (thrown) {
          const reason = getErrorMessage(thrown)

          notDeletedContacts.push({
            id,
            name,
            reason: isActiveUserLinkedContactError(reason)
              ? 'Contact is linked to an active Odoo user and cannot be deleted.'
              : reason,
          })
        }
      }

      return {
        success: notDeletedContacts.length === 0,
        deletedIds,
        notDeletedContacts,
      }
    },
  },
  channels: {},
  handler: async () => {},
})
