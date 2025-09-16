import * as bp from '.botpress'
import { v1 } from 'pipedrive'
import { getApiConfig } from '../auth'

export const createNote: bp.IntegrationProps['actions']['createNote'] = async ({ ctx, input }) => {
    const notesApi = new v1.NotesApi(await getApiConfig({ ctx }))
    const { content, lead_id, person_id, deal_id, org_id, project_id, user_id } = input

    const newNoteRequest: v1.AddNoteRequest = {
        content,
        ...(lead_id !== undefined && { lead_id }),
        ...(person_id !== undefined && { person_id }),
        ...(deal_id !== undefined && { deal_id }),
        ...(org_id !== undefined && { org_id }),
        ...(project_id !== undefined && { project_id }),
        ...(user_id !== undefined && { user_id })
    }

    const req: v1.NotesApiAddNoteRequest = { AddNoteRequest: newNoteRequest }
    const res = await notesApi.addNote(req)

    return { note: res.data }
} 