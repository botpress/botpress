import type { Integration } from '@botpress/client'
import { casing } from '../utils'
import { ConfigurationModule } from './configuration'
import { INDEX_FILE } from './const'
import { Module, ModuleDef } from './module'

const CONTENT = ({
  name,
  className,
  propsName,
  version,
  id,
}: {
  name: string
  className: string
  propsName: string
  version: string
  id: string
}) => `
import type { IntegrationInstance } from '@botpress/sdk'
import type { Configuration } from './configuration'


export type ${propsName} = {
  enabled?: boolean
  config?: Configuration
}

export class ${className} implements IntegrationInstance {
  
  
  public readonly name = '${name}'
  public readonly version = '${version}'
  public readonly id = '${id}'
  
  public readonly enabled?: boolean
  public readonly configuration?: Configuration

  constructor(props?: ${propsName}) {
    this.enabled = props?.enabled
    this.configuration = props?.config
  }
}
`

export class IntegrationInstanceIndexModule extends Module {
  public static async create(integration: Integration): Promise<IntegrationInstanceIndexModule> {
    const { name, version, id } = integration

    const configModule = await ConfigurationModule.create(integration.configuration ?? { schema: {} })

    const exportName = casing.to.pascalCase(name)

    const content = CONTENT({ name, className: exportName, propsName: `${exportName}Props`, version, id })
    const inst = new IntegrationInstanceIndexModule({ path: INDEX_FILE, content, exportName })

    inst.pushDep(configModule)

    return inst
  }

  private constructor(def: ModuleDef) {
    super(def)
  }
}
