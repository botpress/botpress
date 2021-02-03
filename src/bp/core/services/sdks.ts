import { injectable } from 'inversify'
import * as sdk from 'botpress/sdk'

@injectable()
export class DynamicSdkService {
  private botDsdks: { [botId: string]: DynamicSdkRepo } = {}
  private globalDsdk: DynamicSdkRepo = new DynamicSdkRepo()

  public forBot(botId: string): DynamicSdkRepo {
    let repo = this.botDsdks[botId]
    if (!repo) {
      repo = new DynamicSdkRepo()
      this.botDsdks[botId] = repo
    }
    return repo
  }

  public global(): DynamicSdkRepo {
    return this.globalDsdk
  }

  public removeSdksForBot(botId: string) {
    delete this.botDsdks[botId]
  }
}

export class DynamicSdkRepo implements sdk.SdkService {
  private dsdks: { [name: string]: sdk.DynamicSdk } = {}

  public register(name: string, impl: sdk.DynamicSdk) {
    this.dsdks[name] = impl
  }

  public get(name: string): sdk.DynamicSdk {
    return this.dsdks[name]
  }
}
