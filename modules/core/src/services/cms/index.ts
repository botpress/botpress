export interface CMSService {
  initialize(): Promise<void>
  getAllContentTypes(botId?: string): Promise<ContentType[]>
  getContentType(contentTypeId: string): Promise<ContentType>

  listContentElements(botId: string, contentTypeId?: string, searchParams?: SearchParams): Promise<ContentElement[]>
  countContentElements(botId: string, contentTypeId: string): Promise<number>
  deleteContentElements(botId: string, ids: string[]): Promise<void>
  getContentElement(botId: string, id: string): Promise<ContentElement>
  getContentElements(botId: string, ids: string[]): Promise<ContentElement[]>
  getRandomContentElement(contentTypeId: string): Promise<ContentElement>

  createOrUpdateContentElement(
    botId: string,
    contentTypeId: string,
    formData: string,
    contentElementId?: string
  ): Promise<string>
}

export type ContentType = {
  id: string
  title: string
  description: string
  jsonSchema: object
  uiSchema?: object
  computePreviewText?: (formData: object) => string
  computeData?: (typeId: string, formData: object) => object
  renderElement: (data: object) => object[]
}

export type ContentElement = {
  id: string
  contentType: string
  formData: object
  computedData: object
  createdOn: Date
  createdBy: string
  modifiedOn: Date
  previewText: string
}

export type SearchParams = {
  searchTerm?: string
  orderBy: string[]
  from: number
  count: number
}

export const DefaultSearchParams: SearchParams = {
  searchTerm: undefined,
  orderBy: ['createdOn'],
  from: 0,
  count: 50
}
