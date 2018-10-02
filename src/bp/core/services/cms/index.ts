export type ContentType = {
  id: string
  title: string
  description: string
  jsonSchema: object
  uiSchema?: object
  computePreviewText?: (formData: object) => string
  computeData?: (typeId: string, formData: object) => object
  renderElement: (data: object, channel: string) => object[]
}

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
