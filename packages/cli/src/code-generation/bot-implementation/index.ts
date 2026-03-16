import * as sdk from '@botpress/sdk'
import * as consts from '../consts'
import * as mod from '../module'
import * as types from '../typings'
import { BotImplementationModule } from './bot-implementation'
import { SecretIndexModule } from '../secret-module'

class BotIndexModule extends mod.Module {
  private _botImplModule: BotImplementationModule
  private _botSecretModule: SecretIndexModule

  public constructor(sdkBotDefinition: sdk.BotDefinition) {
    super({
      path: consts.INDEX_FILE,
      exportName: '',
    })

    const botImpl = new BotImplementationModule(sdkBotDefinition)
    botImpl.unshift(consts.fromOutDir.implementationDir)
    this.pushDep(botImpl)
    this._botImplModule = botImpl

    const botSecrets = new SecretIndexModule(sdkBotDefinition.secrets ?? {})
    botSecrets.unshift(consts.fromOutDir.secretsDir)
    this.pushDep(botSecrets)
    this._botSecretModule = botSecrets
  }

  public async getContent(): Promise<string> {
    const botImplImport = this._botImplModule.import(this)
    const botSecretImport = this._botSecretModule.import(this)

    return [
      //
      consts.GENERATED_HEADER,
      `export * from "./${botImplImport}"`,
      `export * from "./${botSecretImport}"`,
    ].join('\n')
  }
}

export const generateBotImplementation = async (sdkBotDefinition: sdk.BotDefinition): Promise<types.File[]> => {
  const botIndexModule = new BotIndexModule(sdkBotDefinition)
  return botIndexModule.flatten()
}
