import { Dropbox, DropboxAuth, type DropboxResponse, type files } from 'dropbox'
import { handleErrorsDecorator as handleErrors } from './error-handling'
import { RequestMapping, ResponseMapping } from './mapping'
import {} from './types'
import * as bp from '.botpress'

export class DropboxClient {
  private readonly _dropboxRestClient: Dropbox

  private constructor({ accessToken }: { accessToken: string }) {
    this._dropboxRestClient = new Dropbox({ accessToken })
  }

  public static async create({ ctx }: { client: bp.Client; ctx: bp.Context }) {
    return new DropboxClient({ accessToken: ctx.configuration.dropboxAccessToken })
  }
}
