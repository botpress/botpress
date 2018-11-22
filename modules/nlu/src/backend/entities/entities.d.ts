export interface EntityMeta {
  confidence: number
  provider: string
  source: string
  start: number
  end: number
  raw: any
}

export interface EntityBody {
  extras: any
  value: any
  unit: string
}

export interface Entity {
  type: string
  meta: EntityMeta
  data: EntityBody
}

export interface EntityExtractor {
  extract: (text: string, lang: string) => Promise<Entity[]>
}
