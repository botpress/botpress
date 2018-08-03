export interface CMSService {
  initialize(): Promise<void>
  getAllContentTypes(): Promise<ContentType[]>
  getAllContentTypes(botId: string): Promise<ContentType[]>
  getContentType(contentType: string): Promise<ContentType>

  listContentElements(botId: string, contentType: string): Promise<ContentElement[]>
  countContentElements(botId: string, contentType: string): Promise<number>
  deleteContentElements(botId: string, ids: string[]): Promise<void>
  getContentElement(botId: string, id: string): Promise<ContentElement>
  getContentElements(botId: string, ids: string[]): Promise<ContentElement[]>
}

export type ContentType = {
  id: string
  title: string
  description: string
  jsonSchema: object
  uiSchema?: object
  computePreviewText?: (typeId: string, formData: object) => string
  computeData?: (typeId: string, formData: object) => object
  renderElement: (data: object) => object[]
}

export type ContentElement = {
  id: string
  contentType: string
  rawData: object
  computedData: object
  createdOn: Date
  createdBy: string
  modifiedOn: Date
  previewText: string
}
