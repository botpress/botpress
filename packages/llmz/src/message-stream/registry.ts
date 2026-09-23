import { NAME_REGEX, type NormalizedComponentDefinition } from './types.js'

/**
 * Stores normalized component definitions. The registry (not the parser) is the
 * single source of truth for which components exist and how they are validated.
 */
export class ComponentRegistry {
  private _definitions = new Map<string, NormalizedComponentDefinition>()

  public constructor(definitions: NormalizedComponentDefinition[] = []) {
    for (const definition of definitions) {
      this.register(definition)
    }
  }

  public register(definition: NormalizedComponentDefinition): void {
    if (!NAME_REGEX.test(definition.name)) {
      throw new Error(
        `Invalid component name "${definition.name}". Component names must be lowercase ([a-z][a-z0-9_-]*).`
      )
    }
    this._definitions.set(definition.name, definition)
  }

  public unregister(name: string): void {
    this._definitions.delete(name)
  }

  public has(name: string): boolean {
    return this._definitions.has(name)
  }

  public get(name: string): NormalizedComponentDefinition | undefined {
    return this._definitions.get(name)
  }

  public list(): NormalizedComponentDefinition[] {
    return [...this._definitions.values()]
  }
}
