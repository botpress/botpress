import { posix as pathlib } from 'path'
import * as utils from '../utils'
import { GENERATED_HEADER, INDEX_FILE } from './const'
import * as strings from './strings'
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

  /**
   * @returns file name without extension
   */
  public get name(): string {
    const basename = pathlib.basename(this.path)
    if (basename === INDEX_FILE) {
      const dirname = pathlib.basename(pathlib.dirname(this.path))
      return dirname
    }
    const withoutExtension = utils.path.rmExtension(basename)
    return withoutExtension
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

export class ReExportTypeModule extends Module {
  protected constructor(def: { exportName: string }) {
    super({
      ...def,
      path: INDEX_FILE,
      content: '',
    })
  }

  public override get content(): string {
    let content = GENERATED_HEADER

    for (const m of this.deps) {
      const { name } = m
      const importAlias = strings.importAlias(name)
      const importFrom = m.import(this)
      content += `import * as ${importAlias} from "./${importFrom}";\n`
      content += `export * as ${importAlias} from "./${importFrom}";\n`
    }

    content += '\n'

    content += `export type ${this.exports} = {\n`
    for (const { name, exports } of this.deps) {
      const importAlias = strings.importAlias(name)
      content += `  "${name}": ${importAlias}.${exports};\n`
    }
    content += '}'

    content += '\n'

    return content
  }
}
