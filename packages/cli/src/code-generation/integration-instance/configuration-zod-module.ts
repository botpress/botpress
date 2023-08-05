import { GENERATED_HEADER, INDEX_FILE } from '../const'
import { jsonSchemaToTypeScriptZod } from '../generators'
import { Module } from '../module'
import type * as types from './types'

export class ConfigurationSchemaModule extends Module {
  public static async create(configuration: types.ConfigurationDefinition): Promise<ConfigurationSchemaModule> {
    const schema = configuration.schema ?? {}
    const name = 'config'
    return new ConfigurationSchemaModule({
      path: `${name}.ts`,
      exportName: name,
      content: await jsonSchemaToTypeScriptZod(schema, name),
    })
  }
}

export class ConfigurationModule extends Module {
  public static async create(configuration: types.ConfigurationDefinition): Promise<ConfigurationModule> {
    const schemaModule = await ConfigurationSchemaModule.create(configuration)

    const inst = new ConfigurationModule({
      content: '',
      path: INDEX_FILE,
      exportName: 'configuration',
    })

    inst.pushDep(schemaModule)

    return inst
  }

  public override get content(): string {
    const { deps } = this
    const schemaModule = deps[0]!
    return [
      GENERATED_HEADER,
      `import { ${schemaModule.exports} } from "./${schemaModule.name}";`,
      '',
      'export const configuration = {',
      `  schema: ${schemaModule.exports},`,
      '}',
    ].join('\n')
  }
}
