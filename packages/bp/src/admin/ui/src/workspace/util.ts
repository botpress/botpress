import _ from 'lodash'

export function filterList<T>(elements: T[], filterFields: string[], query: string): T[] {
  if (!query) {
    return elements
  }

  query = query.toLowerCase()

  return elements.filter(el =>
    filterFields.find(field =>
      _.get(el, field, '')
        .toLowerCase()
        .includes(query)
    )
  )
}
