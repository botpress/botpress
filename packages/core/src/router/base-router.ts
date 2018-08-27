import express from 'express'

export abstract class BaseRouter {
  private _router = express.Router()

  constructor() {
    this.init()
    this.setupRoutes()
  }

  protected abstract init(): void

  protected abstract setupRoutes(): void

  get router() {
    return this._router
  }
}
