import * as sdk from '@botpress/sdk'
import { KommoClient, CreateContactRequest, KommoContact, getErrorMessage } from '../kommo-api'
import * as bp from '.botpress'

// mapping kommo to local schema
function mapKommoContactToBotpress(contact: KommoContact) {
  return {
    id: contact.id,
    name: contact.name,
    firstName: contact.first_name,
    lastName: contact.last_name,
    responsibleUserId: contact.responsible_user_id,
    groupId: contact.group_id,
    updatedBy: contact.updated_by,
    createdAt: contact.created_at,
    updatedAt: contact.updated_at,
    closestTaskAt: contact.closest_task_at ?? undefined,
    isDeleted: contact.is_deleted,
    accountId: contact.account_id,
  }
}

export const createContact: bp.IntegrationProps['actions']['createContact'] = async ({ ctx, input, logger }) => {
  try {
    logger.forBot().info('Creating contact with input:', input)

    const { baseDomain, accessToken } = ctx.configuration
    const kommoClient = new KommoClient(accessToken, baseDomain, logger)

    const contactData: CreateContactRequest = {
      name: input.name,
      first_name: input.firstName,
      last_name: input.lastName,
      responsible_user_id: input.responsibleUserId,
      created_by: input.createdBy,
      updated_by: input.updatedBy,
    }

    logger.forBot().info('Contact data to send:', contactData)
    const kommoContact = await kommoClient.createContact(contactData)
    logger.forBot().info('Contact created successfully:', { contactId: kommoContact.id })
    return {
      contact: mapKommoContactToBotpress(kommoContact),
    }
  } catch (error) {
    logger.forBot().error('Failed to create contact', { error })
    throw new sdk.RuntimeError(getErrorMessage(error))
  }
}

export const searchContacts: bp.IntegrationProps['actions']['searchContacts'] = async ({ ctx, input, logger }) => {
  try {
    logger.forBot().info('Searching contacts:', { query: input.query })
    const { baseDomain, accessToken } = ctx.configuration

    const kommoClient = new KommoClient(accessToken, baseDomain, logger)
    const kommoContacts = await kommoClient.searchContacts(input.query)

    const contacts = kommoContacts.map(mapKommoContactToBotpress)

    logger.forBot().info('Search complete:', { count: contacts.length })

    return { contacts }
  } catch (error) {
    logger.forBot().error('Failed to search contacts', { error })
    throw new sdk.RuntimeError(getErrorMessage(error))
  }
}
