import * as sdk from 'botpress/sdk'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'

@injectable()
export class SpeechService {
  constructor() {}

  public parse(arg: any): string {
    return "j'aime les bananes"
  }
}
