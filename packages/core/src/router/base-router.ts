import express from 'express'

export abstract class BaseRouter {
  private _router = express.Router()

  protected abstract setupRoutes(): void

  get router() {
    return this._router
  }
}
