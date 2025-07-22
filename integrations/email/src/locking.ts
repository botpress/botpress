import * as bp from '.botpress'

export class LockHandler {
  public constructor(private readonly _props: { client: bp.Client; ctx: bp.Context }) {}

  public async setLock(value: boolean): Promise<void> {
    await this._props.client.getOrSetState({
      name: 'syncLock',
      id: this._props.ctx.integrationId,
      type: 'integration',
      payload: {
        currentlySyncing: value,
      },
    })
  }

  public async readLock(): Promise<boolean> {
    const syncLock = await this._props.client.getState({
      name: 'syncLock',
      id: this._props.ctx.integrationId,
      type: 'integration',
    })
    return syncLock.state.payload.currentlySyncing ?? false
  }
}
