import qs from 'querystring'

export const prepareParams = async <T extends qs.ParsedUrlQueryInput>(input: T) => {
  return {
    query: qs.stringify(input),
    length: Object.keys(input).length,
  }
}
