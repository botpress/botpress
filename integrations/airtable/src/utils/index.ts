import { Config } from '../misc/types'
import { tableFields } from 'src/misc/custom-types'
import { AirtableApi } from '../client'

export function getClient(config: Config) {
  return new AirtableApi(config.accessToken, config.baseId, config.endpointUrl)
}

export function fieldsStringToArray(fieldsString: string) {
  let fields: tableFields
  try {
    fields = fieldsString.split(',').map((fieldString) => {
      const [type, name] = fieldString.trim().split('_')
      if (type === '' || type === undefined) throw new Error('Type is Required')
      if (name === '' || name === undefined) throw new Error('Name is Required')
      return {
        type: type,
        name: name,
      }
    })
  } catch (error) {
    fields = []
  }
  return fields
}
