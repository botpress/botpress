import sdk from '@botpress/sdk'

export namespace IsoToRFC3339 {
  export const convertDate = (input: string | Date): string => {
    const date = input instanceof Date ? input : new Date(_parseDateString(input))

    if (!_isValidDate(date)) {
      throw new sdk.RuntimeError(`Invalid date: ${input}`)
    }

    return date.toISOString().replace(/\.000Z$/, 'Z')
  }

  const _parseDateString = (dateString: string): string =>
    _ensureTimeZoneIsPresent(_insertColonInTimeZone(_removeWhitespace(_replaceSpaceWithT(dateString))))

  const _replaceSpaceWithT = (input: string): string => input.trim().replace(' ', 'T')

  const _removeWhitespace = (input: string): string => input.replace(/\s+/g, '')

  const _insertColonInTimeZone = (input: string): string => input.replace(/([+-]\d{2})(\d{2})$/, '$1:$2')

  const _ensureTimeZoneIsPresent = (input: string): string => {
    if (!/Z$|[+-]\d{2}:\d{2}$/.test(input)) {
      return input + 'Z' // Assume UTC
    }
    return input
  }

  const _isValidDate = (date: Date): boolean => date instanceof Date && !isNaN(date.getTime())
}
