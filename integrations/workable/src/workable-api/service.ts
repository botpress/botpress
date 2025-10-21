import * as bp from '.botpress'
import { WorkableClient } from './client'
import { fromListCandidatesInputModel, toListCandidatesOutputModel } from 'src/candidate-mapper'

type Output<K extends keyof Actions> = Actions[K]['output']
type Actions = bp.actions.Actions
type Input<K extends keyof Actions> = Actions[K]['input']

export class WorkableService {
  private _client: WorkableClient

  public constructor(client: WorkableClient) {
    this._client = client
  }

  public async listCandidates(input: Input<'listCandidates'>): Promise<Output<'listCandidates'>> {
    const raw = await this._client.listCandidates(fromListCandidatesInputModel(input))
    const converted = toListCandidatesOutputModel(raw)
    return converted
  }
}
