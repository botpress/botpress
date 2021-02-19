import * as sdk from 'botpress/sdk'
import { injectable } from 'inversify'

@injectable()
export class CustomFunctionService {
  private botFunctions: { [botId: string]: CustomFunctionRepo } = {}
  private globalFunctions: CustomFunctionRepo = new CustomFunctionRepo()

  public forBot(botId: string): CustomFunctionRepo {
    let repo = this.botFunctions[botId]
    if (!repo) {
      repo = new CustomFunctionRepo()
      this.botFunctions[botId] = repo
    }
    return repo
  }

  public global(): CustomFunctionRepo {
    return this.globalFunctions
  }

  public removeFunctionsForBot(botId: string) {
    delete this.botFunctions[botId]
  }
}

export class CustomFunctionRepo implements sdk.experimental.FunctionService {
  private functions: { [name: string]: sdk.experimental.FunctionGroup } = {}

  public register(name: string, impl: sdk.experimental.FunctionGroup) {
    this.functions[name] = impl
  }

  public remove(name: string) {
    delete this.functions[name]
  }

  public get(name: string): sdk.experimental.FunctionGroup {
    return this.functions[name]
  }
}
