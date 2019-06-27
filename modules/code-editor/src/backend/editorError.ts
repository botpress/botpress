export enum EditorErrorStatus {
  INVALID_NAME = 'INVALID_NAME',
  FILE_ALREADY_EXIST = 'FILE_ALREADY_EXIST'
}

export class EditorError extends Error {
  private _status: EditorErrorStatus

  constructor(message: string, status: EditorErrorStatus) {
    super(message)

    this._status = status
  }

  public get status() {
    return this._status
  }
}
