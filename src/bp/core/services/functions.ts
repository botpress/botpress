import { injectable } from 'inversify'
import * as sdk from 'botpress/sdk'

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

export class CustomFunctionRepo implements sdk.FunctionService {
  private functions: { [name: string]: sdk.FunctionGroup } = {}

  public register(name: string, impl: sdk.FunctionGroup) {
    this.functions[name] = impl
  }

  public get(name: string): sdk.FunctionGroup {
    return this.functions[name]
  }
}
