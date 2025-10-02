import { bambooHrCompanyInfo } from 'definitions'
import { BambooHRClient } from 'src/api/bamboohr-client'
import { parseResponseWithErrors } from 'src/api/utils'

import * as bp from '.botpress'

export const getCompanyInfo: bp.IntegrationProps['actions']['getCompanyInfo'] = async (props) => {
  const client = await BambooHRClient.create(props)

  const url = new URL(`${client.baseUrl}/company_information`)
  const res = await client.makeRequest(props, { method: 'GET', url })

  return parseResponseWithErrors(res, bambooHrCompanyInfo)
}
