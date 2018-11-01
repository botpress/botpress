export type SearchParams = {
  searchTerm?: string
  orderBy: string[]
  from: number
  count: number
  ids?: string[]
}

export const DefaultSearchParams: SearchParams = {
  orderBy: ['createdOn'],
  from: 0,
  count: 50
}
