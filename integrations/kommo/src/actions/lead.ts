import * as sdk from '@botpress/sdk'
import { KommoClient, CreateLeadRequest, UpdateLeadRequest, KommoLead, getErrorMessage } from '../kommo-api'
import * as bp from '.botpress'

// mapping kommo to local schema
function mapKommoLeadToBotpress(lead: KommoLead) {
  return {
    id: lead.id,
    name: lead.name,
    price: lead.price,
    responsibleUserId: lead.responsible_user_id,
    pipelineId: lead.pipeline_id,
    statusId: lead.status_id,
    createdAt: lead.created_at,
    updatedAt: lead.updated_at,
  }
}

export const createLead: bp.IntegrationProps['actions']['createLead'] = async ({ ctx, input, logger }) => {
  try {
    logger.forBot().debug('Creating lead with input:', input)
    logger.forBot().debug('Configuration:', { baseDomain: ctx.configuration.baseDomain })

    const { baseDomain, accessToken } = ctx.configuration
    const kommoClient = new KommoClient(accessToken, baseDomain, logger)

    const leadData: CreateLeadRequest = {
      name: input.name,
      price: input.price,
      responsible_user_id: input.responsibleUserId,
      pipeline_id: input.pipelineId,
      status_id: input.statusId,
    }

    logger.forBot().info('Lead data to send:', leadData)
    const kommoLead = await kommoClient.createLead(leadData)
    logger.forBot().info('Lead created successfully:', { leadId: kommoLead.id })

    return {
      lead: mapKommoLeadToBotpress(kommoLead),
    }
  } catch (error) {
    logger.forBot().error('Error creating lead:', { error })
    throw new sdk.RuntimeError(getErrorMessage(error))
  }
}

// handler for updating lead
export const updateLead: bp.IntegrationProps['actions']['updateLead'] = async ({ ctx, input, logger }) => {
  try {
    logger.forBot().info('Updating lead:', input)

    const { baseDomain, accessToken } = ctx.configuration
    const kommoClient = new KommoClient(accessToken, baseDomain, logger)

    const updateData: UpdateLeadRequest = {
      name: input.name,
      price: input.price,
      responsible_user_id: input.responsibleUserId,
      pipeline_id: input.pipelineId,
      status_id: input.statusId,
    }

    logger.forBot().info('Update data to send:', updateData)
    const kommoLead = await kommoClient.updateLead(input.leadId, updateData)
    logger.forBot().info('Lead updated successfully:', { leadId: kommoLead.id })

    return {
      lead: mapKommoLeadToBotpress(kommoLead),
    }
  } catch (error) {
    logger.forBot().error('Error updating lead:', { error })
    throw new sdk.RuntimeError(getErrorMessage(error))
  }
}

// search for lead action
export const searchLeads: bp.IntegrationProps['actions']['searchLeads'] = async ({ ctx, input, logger }) => {
  try {
    logger.forBot().info('Searching leads:', { query: input.query })

    const { baseDomain, accessToken } = ctx.configuration
    const kommoClient = new KommoClient(accessToken, baseDomain, logger)
    const kommoLeads = await kommoClient.searchLeads(input.query)

    const leads = kommoLeads.map(mapKommoLeadToBotpress)

    logger.forBot().info('Search complete:', { count: leads.length })

    return { leads }
  } catch (error) {
    logger.forBot().error('Failed to search leads', { error })
    throw new sdk.RuntimeError(getErrorMessage(error))
  }
}
