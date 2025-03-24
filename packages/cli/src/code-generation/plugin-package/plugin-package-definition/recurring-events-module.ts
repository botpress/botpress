import * as gen from '../../generators'
import { Module, ReExportVariableModule } from '../../module'
import * as strings from '../../strings'
import * as commonTypes from '../../typings'

class RecurringEventModule extends Module {
  public constructor(
    name: string,
    private _event: commonTypes.DynamicRecurringEvents[string]
  ) {
    const eventName = name
    const exportName = strings.varName(eventName)
    super({ path: `${name}.ts`, exportName })
  }

  public async getContent(): Promise<string> {
    if (typeof this._event === 'function') {
      return '// @ts-ignore\n' + `export const ${this.exportName} = ${gen.getFunctionSource(this._event)}`
    } else {
      return `export const ${this.exportName} = ${JSON.stringify(this._event)}`
    }
  }
}

export class RecurringEventsModule extends ReExportVariableModule {
  public constructor(recurringEvents: commonTypes.DynamicRecurringEvents) {
    super({ exportName: strings.varName('recurringEvents') })
    for (const [eventName, event] of Object.entries(recurringEvents)) {
      const module = new RecurringEventModule(eventName, event)
      this.pushDep(module)
    }
  }
}
