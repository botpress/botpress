export class UpdateTask {
  public runTask: (() => Promise<void>) | undefined

  private _currentPromise
  private _intervalRef

  constructor(private _bp, private _interval: number) {}

  async start(botId) {
    if (this._intervalRef) {
      throw new Error('The update is already running.')
    }
    this._intervalRef = setInterval(this._runTaskWhenReady.bind(this), this._interval)
  }

  stop(botId) {
    clearInterval(this._intervalRef)
    this._intervalRef = undefined
  }

  private async _runTaskWhenReady() {
    if (this._currentPromise) {
      return
    }

    this._currentPromise =
      this.runTask &&
      this.runTask()
        .catch(err => this._bp.logger.warn('Error running update: ' + err.message))
        .finally(() => {
          this._currentPromise = undefined
        })
  }
}
