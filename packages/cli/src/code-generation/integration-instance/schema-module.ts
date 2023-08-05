import { ReExportModule } from '../module'

export class ReExportSchemaModule extends ReExportModule {
  public mainExportBlock(): string {
    let content = ''
    content += `export const ${this.exports} = {\n`
    for (const { name, exports } of this.deps) {
      content += `  ${name}: { schema: ${name}.${exports} },\n`
    }
    content += '}'
    return content
  }
}
