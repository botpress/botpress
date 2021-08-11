interface ModelPrimaryKey {
  botId: string
  language: string
  state: 'ready' | 'training'
}

export interface Model extends ModelPrimaryKey {
  modelId: string
  definitionHash: string
}

export interface ModelRepository {
  get(key: ModelPrimaryKey): Promise<Model | undefined>
  set(model: Model): Promise<void>
  del(key: ModelPrimaryKey): Promise<void>
  query(query: Partial<Model>): Promise<Model[]>
}
