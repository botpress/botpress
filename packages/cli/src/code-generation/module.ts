import { posix as pathlib } from 'path'
import * as utils from '../utils'
import * as consts from './consts'
import * as strings from './strings'
import { File } from './typings'

export type ModuleProps = {
  path: string
  exportName: string
}

export abstract class Module {
  private _localDependencies: Module[] = []

  public get path(): string {
    return this._def.path
  }

  /**
   * @returns file name without extension
   */
  public get name(): string {
    const basename = pathlib.basename(this.path)
    if (basename === consts.INDEX_FILE || basename === consts.INDEX_DECLARATION_FILE) {
      const dirPath = pathlib.dirname(this.path)
      const dirname = pathlib.basename(dirPath)
      return dirname
    }
    const withoutExtension = utils.path.rmExtension(basename)
    return withoutExtension
  }

  public get isDefaultExport(): boolean {
    return this._def.exportName === consts.DEFAULT_EXPORT_NAME
  }

  public get exportName(): string {
    return this._def.exportName
  }

  public get deps(): Module[] {
    return [...this._localDependencies]
  }

  protected constructor(private _def: ModuleProps) {}

  public abstract getContent(): Promise<string>

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

  public async toFile(): Promise<File> {
    return {
      path: this.path,
      content: await this.getContent(),
    }
  }

  public async flatten(): Promise<File[]> {
    const self = await this.toFile()
    const allFiles: File[] = [self]
    for (const dep of this._localDependencies) {
      const depFiles = await dep.flatten()
      allFiles.push(...depFiles)
    }
    return allFiles
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
      path: consts.INDEX_FILE,
    })
  }

  public async getContent(): Promise<string> {
    let content = consts.GENERATED_HEADER

    for (const m of this.deps) {
      const { name } = m
      const importAlias = strings.importAlias(name)
      const importFrom = m.import(this)
      content += `import * as ${importAlias} from "./${importFrom}";\n`
      content += `export * as ${importAlias} from "./${importFrom}";\n`
    }

    content += '\n'

    content += `export type ${this.exportName} = {\n`
    for (const { name, exportName: exports } of this.deps) {
      const importAlias = strings.importAlias(name)
      content += `  "${name}": ${importAlias}.${exports};\n`
    }
    content += '}'

    content += '\n'

    return content
  }
}

export class ReExportVariableModule extends Module {
  protected constructor(def: { exportName: string }) {
    super({
      ...def,
      path: consts.INDEX_FILE,
    })
  }

  public async getContent(): Promise<string> {
    let content = consts.GENERATED_HEADER

    for (const m of this.deps) {
      const { name } = m
      const importAlias = strings.importAlias(name)
      const importFrom = m.import(this)
      content += `import * as ${importAlias} from "./${importFrom}";\n`
      content += `export * as ${importAlias} from "./${importFrom}";\n`
    }

    content += '\n'

    content += `export const ${this.exportName} = {\n`
    for (const { name, exportName: exports } of this.deps) {
      const importAlias = strings.importAlias(name)
      content += `  "${name}": ${importAlias}.${exports},\n`
    }
    content += '}'

    content += '\n'

    return content
  }
}
