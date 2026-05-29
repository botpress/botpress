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

export type PathSection = KeySectionIndex | NumberSectionIndex | StringSectionIndex | AnySectionIndex | PropertyPath

export class PropertyPath {
  public readonly type = 'propertyPath'
  private readonly _sections: PathSection[]
  private readonly _wrapper: string

  constructor(sections: PathSection[] = [], wrapper: string = '') {
    this._sections = sections
    this._wrapper = wrapper
  }

  withIndexType(type: 'key', value: string): PropertyPath
  withIndexType(type: 'number', value?: number): PropertyPath
  withIndexType(type: 'string', value?: string): PropertyPath
  withIndexType(type: 'any'): PropertyPath
  withIndexType(type: 'number' | 'string' | 'any' | 'key', value?: number | string): PropertyPath {
    return new PropertyPath([...this._sections, { type, value } as PathSection], this._wrapper)
  }

  withWrapper(wrapper: string): PropertyPath {
    return new PropertyPath([new PropertyPath([...this._sections], wrapper)])
  }

  toString(): string {
    const wrapperBegin = this._wrapper ? `${this._wrapper}<` : ''
    const wrapperEnd = this._wrapper ? '>' : ''
    const rootCarAtBeginning = this._sections.length === 0 || this._sections[0]!.type !== 'propertyPath' ? '#' : ''

    return `${wrapperBegin}${rootCarAtBeginning}${this._sections
      .map((section) => {
        if (section.type === 'propertyPath') return section.toString()
        if (section.type === 'key') return `.${section.value}`
        if (section.type === 'any') return '[*]'
        return `[${section.value ?? section.type}]`
      })
      .join('')}${wrapperEnd}`
  }
}
