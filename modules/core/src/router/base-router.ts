import express from 'express'

export abstract class BaseRouter {
  private _router = express.Router()

  constructor() {
    this.setupRoutes()
  }

  protected abstract setupRoutes(): void

  get router() {
    return this._router
  }
}
