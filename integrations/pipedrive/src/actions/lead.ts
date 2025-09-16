import * as bp from '.botpress'
import { v1 } from 'pipedrive'
import { getApiConfig } from '../auth'

export const createLead: bp.IntegrationProps['actions']['createLead'] = async ({ ctx, input }) => {
    const leadsApi = new v1.LeadsApi(await getApiConfig({ ctx }))
    const { title, owner_id, person_id, organization_id, value, expected_close_date, visible_to } = input
 
    const newLeadRequest: v1.AddLeadRequest = {
        title,
        ...(owner_id !== undefined && { owner_id }),
        ...(person_id !== undefined && { person_id }),
        ...(organization_id !== undefined && { organization_id }),
        ...(value !== undefined && { value }),
        ...(expected_close_date !== undefined && { expected_close_date }),
        ...(visible_to !== undefined && { visible_to })
    }
 
    const req: v1.LeadsApiAddLeadRequest = { AddLeadRequest: newLeadRequest }
    const res = await leadsApi.addLead(req)

    return { lead: res.data }
}

export const updateLead: bp.IntegrationProps['actions']['updateLead'] = async ({ ctx, input }) => {
    const leadsApi = new v1.LeadsApi(await getApiConfig({ ctx }))
    const { lead_id, title, owner_id, person_id, organization_id, value, expected_close_date, visible_to } = input

    const body: v1.UpdateLeadRequest = {
        ...(title !== undefined && { title }),
        ...(owner_id !== undefined && { owner_id }),
        ...(person_id !== undefined && { person_id }),
        ...(organization_id !== undefined && { organization_id }),
        ...(value !== undefined && { value }),
        ...(expected_close_date !== undefined && { expected_close_date }),
        ...(visible_to !== undefined && { visible_to })
    }

    const req: v1.LeadsApiUpdateLeadRequest = { id: lead_id, UpdateLeadRequest: body }
    const res = await leadsApi.updateLead(req)

    return { lead: res.data }
}

export const findLead: bp.IntegrationProps['actions']['findLead'] = async ({ ctx, input }) => {
    const leadsApi = new v1.LeadsApi(await getApiConfig({ ctx }))
    const { term, fields, exact_match, person_id, organization_id } = input

    const req: v1.LeadsApiSearchLeadsRequest = {
        term,
        ...(fields?.length && { fields: fields as any }),
        ...(exact_match !== undefined && { exact_match }),
        ...(typeof person_id === 'number' && person_id > 0 && { person_id }),
        ...(typeof organization_id === 'number' && organization_id > 0 && { organization_id }),
    }

    const res = await leadsApi.searchLeads(req)

    return { lead: res.data?.items ?? [] }
}