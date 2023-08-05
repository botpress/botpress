import { posix as pathlib } from 'path'
import * as utils from '../utils'
import { GENERATED_HEADER, INDEX_FILE } from './const'
import type { File } from './typings'

export type ModuleDef = File & {
  exportName: string
}

export abstract class Module implements File {
  private _localDependencies: Module[] = []

  public get path(): string {
    return this._def.path
  }

  public get content(): string {
    return this._def.content
  }

  public get name(): string {
    const basename = pathlib.basename(this.path)
    if (basename === INDEX_FILE) {
      const dirname = pathlib.basename(pathlib.dirname(this.path))
      return utils.casing.to.camelCase(dirname)
    }
    const withoutExtension = utils.path.rmExtension(basename)
    return utils.casing.to.camelCase(withoutExtension)
  }

  public get exports(): string {
    return this._def.exportName
  }

  public get deps(): Module[] {
    return [...this._localDependencies]
  }

  protected constructor(private _def: ModuleDef) {}

  public pushDep(...dependencies: Module[]): this {
    this._localDependencies.push(...dependencies)
    return this
  }

  public unshift(...basePath: string[]): this {
    this._def = {
      ...this._def,
      path: pathlib.join(...basePath, this._def.path),
    }
    this._localDependencies = this._localDependencies.map((d) => d.unshift(...basePath))
    return this
  }

  public flatten(): File[] {
    return [this, ...this._localDependencies.flatMap((d) => d.flatten())]
  }

  public import(base: Module): string {
    let relativePath = pathlib.relative(pathlib.dirname(base.path), this.path)
    relativePath = pathlib.join('.', relativePath)
    return utils.path.rmExtension(relativePath)
  }
}

export abstract class ReExportModule extends Module {
  protected constructor(def: { exportName: string }) {
    super({
      ...def,
      path: INDEX_FILE,
      content: '',
    })
  }

  public abstract mainExportBlock(): string

  public override get content(): string {
    let content = GENERATED_HEADER
    const dependencies = this.deps

    for (const m of dependencies) {
      const { name } = m
      const importFrom = m.import(this)
      content += `import * as ${name} from "./${importFrom}";\n`
      content += `export * as ${name} from "./${importFrom}";\n`
    }

    content += '\n'
    content += this.mainExportBlock()
    content += '\n'

    return content
  }
}

export class ReExportTypeModule extends ReExportModule {
  public mainExportBlock(): string {
    let content = ''
    content += `export type ${this.exports} = {\n`
    for (const { name, exports } of this.deps) {
      content += `  ${name}: ${name}.${exports};\n`
    }
    content += '}'
    return content
  }
}

export class ReExportConstantModule extends ReExportModule {
  public mainExportBlock(): string {
    let content = ''
    content += `export const ${this.exports} = {\n`
    for (const { name, exports } of this.deps) {
      content += `  ${name}: ${name}.${exports},\n`
    }
    content += '}'
    return content
  }
}
