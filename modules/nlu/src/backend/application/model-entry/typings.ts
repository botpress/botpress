export interface ModelKey {
  botId: string
  language: string
}

export interface ModelEntry extends ModelKey {
  modelId: string
  definitionHash: string
}
