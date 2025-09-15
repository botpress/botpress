import { FilterBuilder } from 'klaviyo-api'

// Utility function to convert a string or date to a date
const toDate = (value: string | Date): Date => {
  if (value instanceof Date) {
    return value
  }
  const date = new Date(value)
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${value}`)
  }
  return date
}

// Returns the filter string (e.g. filterBuilder.equals('email', 'test@test.com').build() => "equals(email, test@test.com)")

export const buildFilter = (field: string, operator: string, value: string | Date): string => {
  const filterBuilder = new FilterBuilder()

  switch (operator) {
    case 'equals':
      return filterBuilder.equals(field, value).build()
    case 'greater-than':
      return filterBuilder.greaterThan(field, toDate(value)).build()
    case 'less-than':
      return filterBuilder.lessThan(field, toDate(value)).build()
    case 'greater-or-equal':
      return filterBuilder.greaterOrEqual(field, toDate(value)).build()
    case 'less-or-equal':
      return filterBuilder.lessOrEqual(field, toDate(value)).build()
    case 'contains':
      return filterBuilder.contains(field, value as string).build()
    case 'starts-with':
      return filterBuilder.startsWith(field, value as string).build()
    case 'ends-with':
      return filterBuilder.endsWith(field, value as string).build()
    default:
      throw new Error(`Unsupported filter operator: ${operator}`)
  }
}
