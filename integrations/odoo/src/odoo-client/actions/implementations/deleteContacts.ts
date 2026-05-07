import { wrapAction } from '../action-wrapper'
import { getErrorMessage, isActiveUserLinkedContactError } from '../errors'

type NotDeletedContact = {
  id: number
  name?: string
  reason: string
}

type DeletableContact = {
  id: number
  name?: string
}

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

const deleteContactsIndividually = async (
  odooClient: {
    deleteContacts: (input: { ids: number[]; context?: Record<string, unknown> }) => Promise<boolean>
  },
  contacts: DeletableContact[],
  context: Record<string, unknown> | undefined
): Promise<{ deletedIds: number[]; notDeletedContacts: NotDeletedContact[] }> => {
  const deletedIds: number[] = []
  const notDeletedContacts: NotDeletedContact[] = []

  for (const { id, name } of contacts) {
    try {
      const success = await odooClient.deleteContacts({ ids: [id], context })

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

  return { deletedIds, notDeletedContacts }
}

export const deleteContacts = wrapAction(
  { actionName: 'deleteContacts', errorMessage: 'Failed to delete Odoo contacts' },
  async ({ odooClient }, input) => {
    const contacts = await odooClient.getContacts({
      ids: input.ids,
      fields: ['id', 'name', 'user_id'],
      context: input.context,
    })
    const contactsById = new Map(
      contacts.flatMap((contact) => (typeof contact.id === 'number' ? [[contact.id, contact]] : []))
    )
    const deletedIds: number[] = []
    const notDeletedContacts: NotDeletedContact[] = []
    const deletableContacts: DeletableContact[] = []

    for (const id of input.ids) {
      const contact = contactsById.get(id)

      if (!contact) {
        notDeletedContacts.push({ id, reason: 'Contact was not found in Odoo.' })
        continue
      }

      const name = getContactName(contact)
      const ownerId = getContactOwnerId(contact)

      if (ownerId !== input.ownerId) {
        notDeletedContacts.push({
          id,
          name,
          reason:
            ownerId === undefined
              ? 'Contact is not assigned to an owner.'
              : `Contact is owned by Odoo user ${ownerId}, not Odoo user ${input.ownerId}.`,
        })
        continue
      }

      deletableContacts.push({ id, name })
    }

    if (deletableContacts.length > 0) {
      try {
        const success = await odooClient.deleteContacts({
          ids: deletableContacts.map(({ id }) => id),
          context: input.context,
        })

        if (success) {
          deletedIds.push(...deletableContacts.map(({ id }) => id))
        } else {
          const individualResult = await deleteContactsIndividually(odooClient, deletableContacts, input.context)

          deletedIds.push(...individualResult.deletedIds)
          notDeletedContacts.push(...individualResult.notDeletedContacts)
        }
      } catch {
        const individualResult = await deleteContactsIndividually(odooClient, deletableContacts, input.context)

        deletedIds.push(...individualResult.deletedIds)
        notDeletedContacts.push(...individualResult.notDeletedContacts)
      }
    }

    return {
      success: notDeletedContacts.length === 0,
      deletedIds,
      notDeletedContacts,
    }
  }
)
