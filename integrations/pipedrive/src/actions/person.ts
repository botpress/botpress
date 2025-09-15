import * as bp from '.botpress'
import { v2 } from 'pipedrive'
import { getApiConfig } from '../auth'

export const createPerson: bp.IntegrationProps['actions']['createPerson'] = async ({ ctx, input }) => {
  const personsApi = new v2.PersonsApi(await getApiConfig({ ctx }))

  const {
    name, org_id, owner_id, visible_to,
    emailValue, emailPrimary,
    phoneValue, phonePrimary,
  } = input

  const addPersonRequest: v2.AddPersonRequest = {
    name,
    ...(org_id !== undefined && { org_id }),
    ...(owner_id !== undefined && { owner_id }),
    ...(visible_to !== undefined && { visible_to }),
    ...(emailValue && { emails: [{ value: emailValue, primary: !!emailPrimary }] }),
    ...(phoneValue && { phones: [{ value: phoneValue, primary: !!phonePrimary }] }),
  }
  const req: v2.PersonsApiAddPersonRequest = { AddPersonRequest: addPersonRequest }
  const res = await personsApi.addPerson(req)

  return { person: res.data}
}

export const updatePerson: bp.IntegrationProps['actions']['updatePerson'] = async ({ ctx, input }) => {
    const personsApi = new v2.PersonsApi(await getApiConfig({ ctx }))
  
    const { person_id, name, org_id, owner_id, visible_to, emailValue, emailPrimary, phoneValue, phonePrimary } = input
  
    const body: v2.UpdatePersonRequest = {
      ...(name !== undefined && { name }),
      ...(org_id !== undefined && { org_id }),
      ...(owner_id !== undefined && { owner_id }),
      ...(visible_to !== undefined && { visible_to }),
      ...(emailValue && { emails: [{ value: emailValue, primary: !!emailPrimary }] }),
      ...(phoneValue && { phones: [{ value: phoneValue, primary: !!phonePrimary }] }),
    }
  
    const req: v2.PersonsApiUpdatePersonRequest = { id: person_id, UpdatePersonRequest: body }
    const res = await personsApi.updatePerson(req)

    return { person: res.data }
}

export const findPerson: bp.IntegrationProps['actions']['findPerson'] = async ({ ctx, input }) => {
    const personsApi = new v2.PersonsApi(await getApiConfig({ ctx }))
    const { term, fields, exact_match } = input
  
    const req: v2.PersonsApiSearchPersonsRequest = {
      term,
      ...(fields && { fields: fields as any }),
      ...(exact_match !== undefined && { exact_match }),
    }
  
    const res = await personsApi.searchPersons(req)

    return { persons: res.data?.items ?? [] }
}