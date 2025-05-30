import type * as sdk from '@botpress/sdk'

export const resolvePluginEntities = <TPlugin extends sdk.PluginDefinition>(plugin: TPlugin): TPlugin => {
  const dereferencer = new PluginEntityDereferencer(plugin)
  return dereferencer.resolve()
}

class PluginEntityDereferencer<TPlugin extends sdk.PluginDefinition> {
  private readonly _zuiReferenceMap: Record<string, sdk.ZuiObjectSchema>

  public constructor(private readonly _plugin: TPlugin) {
    this._zuiReferenceMap = PluginEntityDereferencer._buildZuiReferenceMap(_plugin)
  }

  public resolve(): TPlugin {
    return {
      ...this._plugin,
      events: this._dereferenceDefinitionSchemas(this._plugin.events),
      states: this._dereferenceDefinitionSchemas(this._plugin.states),
      tables: this._dereferenceDefinitionSchemas(this._plugin.tables),
      actions: this._dereferenceActionDefinitionSchemas(this._plugin.actions),
    }
  }

  private static _buildZuiReferenceMap(plugin: sdk.PluginDefinition): Record<string, sdk.ZuiObjectSchema> {
    return Object.fromEntries(
      (Object.entries(plugin.interfaces ?? {}) as [string, sdk.InterfacePackage][]).flatMap(
        ([interfaceAlias, interfacePackage]) =>
          Object.entries(interfacePackage.definition.entities ?? {}).map(([entityName, entityDefinition]) => [
            `interface:${interfaceAlias}/entities/${entityName}`,
            entityDefinition.schema,
          ])
      )
    )
  }

  private _dereferenceZuiSchema(schema: sdk.ZuiObjectOrRefSchema): sdk.ZuiObjectSchema {
    return schema.dereference(this._zuiReferenceMap) as sdk.ZuiObjectSchema
  }

  private _dereferenceDefinitionSchemas<TDefinitionRecord extends Record<string, { schema: sdk.ZuiObjectOrRefSchema }>>(
    definitions: TDefinitionRecord | undefined
  ): TDefinitionRecord {
    return Object.fromEntries(
      Object.entries(definitions ?? {}).map(([key, definition]) => [
        key,
        { ...definition, schema: this._dereferenceZuiSchema(definition.schema) },
      ])
    ) as TDefinitionRecord
  }

  private _dereferenceActionDefinitionSchemas<
    TDefinitionRecord extends Record<
      string,
      { input: { schema: sdk.ZuiObjectOrRefSchema }; output: { schema: sdk.ZuiObjectOrRefSchema } }
    >,
  >(definitions: TDefinitionRecord | undefined): TDefinitionRecord {
    return Object.fromEntries(
      Object.entries(definitions ?? {}).map(([key, definition]) => [
        key,
        {
          ...definition,
          input: { schema: this._dereferenceZuiSchema(definition.input.schema) },
          output: { schema: this._dereferenceZuiSchema(definition.output.schema) },
        },
      ])
    ) as TDefinitionRecord
  }
}
