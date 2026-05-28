import * as sdk from '@botpress/sdk'
import { z } from '@botpress/sdk'
import { wrapAction } from '../../action-wrapper'
import { getErrorMessage } from '../../errors'

type NotDeletedLead = {
  id: number
  name?: string
  reason: string
}

type DeletableLead = {
  id: number
  name?: string
}

const getLeadOwnerId = (lead: Record<string, unknown>): number | undefined => {
  const owner = lead.user_id

  const isNumberArray = z.array(z.number()).safeParse(owner)
  if (isNumberArray.success) {
    return isNumberArray.data[0]
  }

  const isNumber = z.number().safeParse(owner)
  if (isNumber.success) {
    return isNumber.data
  }

  return undefined
}

const getLeadName = (lead: Record<string, unknown>): string | undefined =>
  typeof lead.name === 'string' ? lead.name : undefined

const getDeleteLeadsMessage = (deletedIds: number[], notDeletedLeads: NotDeletedLead[]): string => {
  if (notDeletedLeads.length === 0) {
    return `Deleted ${deletedIds.length} Odoo lead${deletedIds.length === 1 ? '' : 's'}.`
  }

  const notDeletedLeadIds = notDeletedLeads.map(({ id }) => id).join(', ')
  const deletedMessage =
    deletedIds.length === 0
      ? 'No Odoo leads were deleted.'
      : `Deleted ${deletedIds.length} Odoo lead${deletedIds.length === 1 ? '' : 's'}: ${deletedIds.join(', ')}.`

  return `${deletedMessage} Could not delete ${notDeletedLeads.length} Odoo lead${
    notDeletedLeads.length === 1 ? '' : 's'
  }: ${notDeletedLeadIds}.`
}

const getNotDeletedLeadsDetails = (notDeletedLeads: NotDeletedLead[]): string =>
  notDeletedLeads.map(({ id, reason }) => `Lead ${id}: ${reason}`).join(' ')

const deleteLeadsIndividually = async (
  odooClient: {
    deleteLeads: (input: { ids: number[]; context?: Record<string, unknown> }) => Promise<boolean>
  },
  leads: DeletableLead[],
  context: Record<string, unknown> | undefined
): Promise<{ deletedIds: number[]; notDeletedLeads: NotDeletedLead[] }> => {
  const deletedIds: number[] = []
  const notDeletedLeads: NotDeletedLead[] = []

  for (const { id, name } of leads) {
    try {
      const success = await odooClient.deleteLeads({ ids: [id], context })

      if (success) {
        deletedIds.push(id)
      } else {
        notDeletedLeads.push({
          id,
          name,
          reason: 'Odoo returned false while deleting this lead. Verify the lead ID and user permissions.',
        })
      }
    } catch (thrown) {
      notDeletedLeads.push({ id, name, reason: getErrorMessage(thrown) })
    }
  }

  return { deletedIds, notDeletedLeads }
}

async function deleteDeletableLeads(
  odooClient: {
    deleteLeads: (input: { ids: number[]; context?: Record<string, unknown> }) => Promise<boolean>
  },
  leads: DeletableLead[],
  context: Record<string, unknown> | undefined
): Promise<{ deletedIds: number[]; notDeletedLeads: NotDeletedLead[] }> {
  if (leads.length === 0) {
    return { deletedIds: [], notDeletedLeads: [] }
  }

  try {
    const success = await odooClient.deleteLeads({
      ids: leads.map(({ id }) => id),
      context,
    })

    if (success) {
      return { deletedIds: leads.map(({ id }) => id), notDeletedLeads: [] }
    }
  } catch {
    // Fall back to individual deletes so we can report which leads failed.
  }

  return deleteLeadsIndividually(odooClient, leads, context)
}

export const deleteLeads = wrapAction(
  { actionName: 'deleteLeads', errorMessage: 'Failed to delete Odoo leads' },
  async ({ odooClient }, input) => {
    const leads = await odooClient.listLeads({
      ids: input.ids,
      fields: ['id', 'name', 'user_id'],
      context: input.context,
    })
    const leadsById = new Map(leads.flatMap((lead) => (typeof lead.id === 'number' ? [[lead.id, lead]] : [])))
    const deletedIds: number[] = []
    const notDeletedLeads: NotDeletedLead[] = []
    const deletableLeads: DeletableLead[] = []

    for (const id of input.ids) {
      const lead = leadsById.get(id)

      if (!lead) {
        notDeletedLeads.push({ id, reason: 'Lead was not found in Odoo.' })
        continue
      }

      const name = getLeadName(lead)
      const ownerId = getLeadOwnerId(lead)

      if (ownerId !== input.ownerId) {
        notDeletedLeads.push({
          id,
          name,
          reason:
            ownerId === undefined
              ? 'Lead is not assigned to an owner.'
              : `Lead is owned by Odoo user ${ownerId}, not Odoo user ${input.ownerId}.`,
        })
        continue
      }

      deletableLeads.push({ id, name })
    }

    const deleteResult = await deleteDeletableLeads(odooClient, deletableLeads, input.context)

    deletedIds.push(...deleteResult.deletedIds)
    notDeletedLeads.push(...deleteResult.notDeletedLeads)

    if (deletedIds.length === 0 && notDeletedLeads.length > 0) {
      throw new sdk.RuntimeError(
        `${getDeleteLeadsMessage(deletedIds, notDeletedLeads)} ${getNotDeletedLeadsDetails(notDeletedLeads)}`
      )
    }

    return {
      deletedIds,
      notDeletedLeads,
    }
  }
)
