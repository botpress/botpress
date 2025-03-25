import * as prettier from 'prettier'
import * as consts from '../../consts'
import * as gen from '../../generators'
import { Module, ReExportVariableModule } from '../../module'
import * as strings from '../../strings'
import * as commonTypes from '../../typings'

class RecurringEventModule extends Module {
  public constructor(
    name: string,
    private _event: commonTypes.RecurringEventDefinition
  ) {
    const eventName = name
    const exportName = strings.varName(eventName)
    super({ path: `${name}.ts`, exportName })
  }

  public async getContent(): Promise<string> {
    const code = [
      consts.GENERATED_HEADER,
      `export const ${this.exportName} = {`,
      `  type: ${gen.primitiveToTypescriptValue(this._event.type)},`,
      `  schedule: ${gen.stringifySingleLine(this._event.schedule)},`,
      `  payload: ${gen.primitiveRecordToRecordString(this._event.payload)}`,
      '}',
    ].join('\n')
    return await prettier.format(code, { parser: 'typescript' })
  }
}

export class RecurringEventsModule extends ReExportVariableModule {
  public constructor(recurringEvents: Exclude<commonTypes.PluginDefinition['recurringEvents'], undefined>) {
    super({ exportName: strings.varName('recurringEvents') })
    for (const [eventName, event] of Object.entries(recurringEvents)) {
      const module = new RecurringEventModule(eventName, event)
      this.pushDep(module)
    }
  }
}
