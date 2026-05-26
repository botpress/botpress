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

export type SectionIndex = NumberSectionIndex | StringSectionIndex | AnySectionIndex

export type PathSection = {
  name: string
  indices: SectionIndex[]
}

export class PropertyPath {
  private readonly _sections: PathSection[]
  private _prefix: string

  constructor(sections: PathSection[] = []) {
    this._sections = sections
    this._prefix = ''
  }

  appendSection(name: string): PropertyPath {
    return new PropertyPath([...this._sections, { name, indices: [] }])
  }

  withIndexType(type: 'number', value?: number): PropertyPath
  withIndexType(type: 'string', value?: string): PropertyPath
  withIndexType(type: 'any'): PropertyPath
  withIndexType(type: 'number' | 'string' | 'any', value?: number | string): PropertyPath {
    if (this._sections.length === 0) return this
    const sections = [...this._sections]
    const last = sections.at(-1)!
    sections[sections.length - 1] = { ...last, indices: [...last.indices, { type, value } as SectionIndex] }
    return new PropertyPath(sections)
  }

  withPrefix(prefix: string): this {
    this._prefix = prefix + ' '
    return this
  }

  toString(): string {
    return (
      this._prefix +
      '#' +
      this._sections
        .map((section) => {
          const indices = section.indices.map((i) => `[${i.type === 'any' ? '*' : (i.value ?? i.type)}]`).join('')
          return `.${section.name}${indices}`
        })
        .join('')
    )
  }
}
