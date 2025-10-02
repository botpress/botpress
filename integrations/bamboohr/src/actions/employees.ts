import {
  bambooHrEmployeeSensitiveInfoResponse,
  bambooHrEmployeeCustomInfoResponse,
  bambooHrEmployeeBasicInfoResponse,
  bambooHrEmployeeDirectoryResponse,
} from 'definitions'
import { BambooHRClient } from 'src/api/bamboohr-client'
import { parseResponseWithErrors } from 'src/api/utils'

import * as bp from '.botpress'

export const getEmployeeBasicInfo: bp.IntegrationProps['actions']['getEmployeeBasicInfo'] = async ({
  input,
  ...props
}) => {
  const client = await BambooHRClient.create(props)

  const url = new URL(`${client.baseUrl}/employees/${input.id}`)
  url.searchParams.append('fields', bambooHrEmployeeBasicInfoResponse.keyof().options.join(','))

  const res = await client.makeRequest(props, { method: 'GET', url })

  return parseResponseWithErrors(res, bambooHrEmployeeBasicInfoResponse)
}

export const getEmployeeSensitiveInfo: bp.IntegrationProps['actions']['getEmployeeSensitiveInfo'] = async ({
  input,
  ...props
}) => {
  const client = await BambooHRClient.create(props)

  const url = new URL(`${client.baseUrl}/employees/${input.id}`)
  url.searchParams.append('fields', bambooHrEmployeeSensitiveInfoResponse.keyof().options.join(','))

  const res = await client.makeRequest(props, { method: 'GET', url })
  return parseResponseWithErrors(res, bambooHrEmployeeSensitiveInfoResponse)
}

export const getEmployeeCustomInfo: bp.IntegrationProps['actions']['getEmployeeCustomInfo'] = async ({
  input,
  ...props
}) => {
  const client = await BambooHRClient.create(props)

  const url = new URL(`${client.baseUrl}/employees/${input.id}`)
  url.searchParams.append('fields', input.fields.join(','))

  const res = await client.makeRequest(props, { method: 'GET', url })
  return parseResponseWithErrors(res, bambooHrEmployeeCustomInfoResponse)
}

export const getEmployeePhoto: bp.IntegrationProps['actions']['getEmployeePhoto'] = async ({ input, ...props }) => {
  const client = await BambooHRClient.create(props)

  const url = new URL(`${client.baseUrl}/employees/${input.id}/photo/${input.size}`)
  const res = await client.makeRequest(props, { method: 'GET', url })

  // Endpoint directly returns bytes of image
  return { blob: await res.blob() }
}

export const listEmployees: bp.IntegrationProps['actions']['listEmployees'] = async (props) => {
  const client = await BambooHRClient.create(props)

  const url = new URL(`${client.baseUrl}/employees/directory`)
  const res = await client.makeRequest(props, { method: 'GET', url })

  const parsed = await parseResponseWithErrors(res, bambooHrEmployeeDirectoryResponse)

  return { employees: parsed.employees }
}
