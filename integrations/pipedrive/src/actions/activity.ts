import * as bp from '.botpress'
import { v2 } from 'pipedrive'
import { getApiConfig } from '../auth'

export const createActivity: bp.IntegrationProps['actions']['createActivity'] = async ({ ctx, input }) => {
    const activitiesApi = new v2.ActivitiesApi(await getApiConfig({ ctx }))
    const { subject, type, user_id, deal_id, 
        lead_id, person_id, project_id, org_id, 
        due_date, due_time, duration, location, location_details,
        public_description, note, busy_flag, 
        participants, attendees } = input

    const loc: v2.ActivityItemLocation | undefined =
        location || location_details
        ? {
            ...(typeof location === 'string' ? { value: location } : {}),
            ...(location_details ?? {}),
        }
        : undefined

    const participantsPayload = (() => {
        const list = [...(participants ?? [])]
        if (typeof person_id === 'number') {
            const hasPrimary = list.some(p => p.primary === true)
            const hasThis = list.some(p => p.person_id === person_id)
            if (!hasThis) {
                list.push({ person_id, ...(hasPrimary ? {} : { primary: true }) })
            } else if (!hasPrimary) {
                for (const p of list) {
                    if (p.person_id === person_id) {
                        p.primary = true
                        break
                    }
                }
            }
        }
        return list
    })()

    const newActivityRequest: v2.AddActivityRequest = {
        subject,
        type,
        ...(user_id !== undefined && { user_id }),
        ...(deal_id !== undefined && { deal_id }),
        ...(lead_id !== undefined && { lead_id }),
        ...(project_id !== undefined && { project_id }),
        ...(org_id !== undefined && { org_id }),
        ...(due_date !== undefined && { due_date }),
        ...(due_time !== undefined && { due_time }),
        ...(duration !== undefined && { duration }),
        ...(loc !== undefined && { location: loc }),
        ...(public_description !== undefined && { public_description }),
        ...(note !== undefined && { note }),
        ...(busy_flag !== undefined && { busy_flag }),
        ...((participantsPayload.length > 0) && { participants: participantsPayload }),
        ...(attendees !== undefined && { attendees })
    }

    const req: v2.ActivitiesApiAddActivityRequest = { AddActivityRequest: newActivityRequest }
    const res = await activitiesApi.addActivity(req)

    return { activity: res.data }
}

export const updateActivity: bp.IntegrationProps['actions']['updateActivity'] = async ({ ctx, input }) => {
    const activitiesApi = new v2.ActivitiesApi(await getApiConfig({ ctx }))
    const { activity_id, subject, type, user_id, 
        deal_id, lead_id, person_id, project_id, 
        org_id, due_date, due_time, duration, 
        location, location_details, public_description, note, 
        busy_flag, participants, attendees } = input

    const loc: v2.ActivityItemLocation | undefined =
        location || location_details
        ? {
            ...(typeof location === 'string' ? { value: location } : {}),
            ...(location_details ?? {}),
        }
        : undefined

    const participantsPayload = (() => {
        const list = [...(participants ?? [])]
        if (typeof person_id === 'number') {
            const hasPrimary = list.some(p => p.primary === true)
            const hasThis = list.some(p => p.person_id === person_id)
            if (!hasThis) {
                list.push({ person_id, ...(hasPrimary ? {} : { primary: true }) })
            } else if (!hasPrimary) {
                for (const p of list) {
                    if (p.person_id === person_id) {
                        p.primary = true
                        break
                    }
                }
            }
        }
        return list
    })()

    const body: v2.AddActivityRequest = {
        subject, type,
        ...(user_id !== undefined && { user_id }),
        ...(deal_id !== undefined && { deal_id }),
        ...(lead_id !== undefined && { lead_id }),
        ...(project_id !== undefined && { project_id }),
        ...(org_id !== undefined && { org_id }),
        ...(due_date !== undefined && { due_date }),
        ...(due_time !== undefined && { due_time }),
        ...(duration !== undefined && { duration }),
        ...(loc !== undefined && { location: loc }),
        ...(public_description !== undefined && { public_description }),
        ...(note !== undefined && { note }),
        ...(busy_flag !== undefined && { busy_flag }),
        ...((participantsPayload.length > 0) && { participants: participantsPayload }),
        ...(attendees !== undefined && { attendees })
    }

    const req: v2.ActivitiesApiUpdateActivityRequest = { id: activity_id, AddActivityRequest: body }
    const res = await activitiesApi.updateActivity(req)

    return { activity: res.data }
}