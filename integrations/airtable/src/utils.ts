import { AirtableApi } from './client'
import { Configuration } from './misc/types'

export function getClient(config: Configuration) {
  return new AirtableApi(config.accessToken, config.baseId, config.endpointUrl)
}

export function fieldsStringToArray(fieldsString: string) {
  try {
    return fieldsString.split(',').map((fieldString) => {
      const [type, name] = fieldString.trim().split('_')
      if (type === '' || type === undefined) {
        throw new Error('Type is Required')
      }
      if (name === '' || name === undefined) {
        throw new Error('Name is Required')
      }

      return {
        type,
        name,
      }
    })
  } catch {
    return []
  }
}
