export type KeySectionIndex = {
  type: 'key'
  value: string
}

export type NumberSectionIndex = {
  type: 'number'
  value?: number
}

export type StringSectionIndex = {
  type: 'string'
  value?: string
}

export type AnySectionIndex = {
  type: 'any'
}

export type PathSection = KeySectionIndex | NumberSectionIndex | StringSectionIndex | AnySectionIndex

export class PropertyPath {
  private readonly _sections: PathSection[]
  private readonly _prefix: string

  constructor(sections: PathSection[] = [], prefix: string = '') {
    this._sections = sections
    this._prefix = prefix
  }

  withIndexType(type: 'key', value: string): PropertyPath
  withIndexType(type: 'number', value?: number): PropertyPath
  withIndexType(type: 'string', value?: string): PropertyPath
  withIndexType(type: 'any'): PropertyPath
  withIndexType(type: 'number' | 'string' | 'any' | 'key', value?: number | string): PropertyPath {
    return new PropertyPath([...this._sections, { type, value } as PathSection], this._prefix)
  }

  withPrefix(prefix: string): PropertyPath {
    return new PropertyPath(this._sections, prefix + ' ')
  }

  toString(): string {
    return `${this._prefix}#${this._sections
      .map((section) => {
        if (section.type === 'key') return `.${section.value}`
        if (section.type === 'any') return '[*]'
        return `[${section.value ?? section.type}]`
      })
      .join('')}`
  }
}
