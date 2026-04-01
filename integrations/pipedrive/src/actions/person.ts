import * as bp from '.botpress'
import { RuntimeError } from '@botpress/sdk'
import { v2 } from 'pipedrive'
import { getApiConfig } from '../auth'
import { getErrorMessage } from '../utils/error-handler'

export const addPerson: bp.IntegrationProps['actions']['addPerson'] = async ({ ctx, input, logger }) => {
  try {
    const personsApi = new v2.PersonsApi(await getApiConfig({ ctx }))

    const { emailValue, emailPrimary, phoneValue, phonePrimary, ...rest } = input

    const addPersonRequest: v2.AddPersonRequest = {
      ...rest,
      ...(emailValue && { emails: [{ value: emailValue, primary: !!emailPrimary }] }),
      ...(phoneValue && { phones: [{ value: phoneValue, primary: !!phonePrimary }] }),
    }

    const req: v2.PersonsApiAddPersonRequest = { AddPersonRequest: addPersonRequest }
    const res = await personsApi.addPerson(req)
    logger.forBot().info(`Person added with id ${res?.data?.id} and name ${res?.data?.name}`)
    return res
  } catch (error) {
    throw new RuntimeError(`Failed to create person: ${getErrorMessage(error)}`)
  }
}

export const updatePerson: bp.IntegrationProps['actions']['updatePerson'] = async ({ ctx, input, logger }) => {
  try {
    const personsApi = new v2.PersonsApi(await getApiConfig({ ctx }))

    const { person_id, emailValue, emailPrimary, phoneValue, phonePrimary, ...rest } = input

    const updatePersonRequest: v2.UpdatePersonRequest = {
      ...rest,
      ...(emailValue && { emails: [{ value: emailValue, primary: !!emailPrimary }] }),
      ...(phoneValue && { phones: [{ value: phoneValue, primary: !!phonePrimary }] }),
    }

    const req: v2.PersonsApiUpdatePersonRequest = { id: person_id, UpdatePersonRequest: updatePersonRequest }
    const res = await personsApi.updatePerson(req)
    logger.forBot().info(`Person with id ${res?.data?.id} is updated`)
    return res
  } catch (error) {
    throw new RuntimeError(`Failed to update person: ${getErrorMessage(error)}`)
  }
}

export const findPerson: bp.IntegrationProps['actions']['findPerson'] = async ({ ctx, input, logger }) => {
  try {
    const personsApi = new v2.PersonsApi(await getApiConfig({ ctx }))

    const { term, fields, organization_id, exact_match } = input

    const req: v2.PersonsApiSearchPersonsRequest = {
      term,
      ...(fields && { fields: fields }),
      ...(organization_id && { organization_id }),
      ...(exact_match && { exact_match }),
    }

    const res = await personsApi.searchPersons(req)
    logger
      .forBot()
      .info(
        `${res?.data?.items?.length} people found for "${term}"${organization_id ? ` in organization with id ${organization_id}` : ''}`
      )
    return res
  } catch (error) {
    throw new RuntimeError(`Failed to find person: ${getErrorMessage(error)}`)
  }
}
