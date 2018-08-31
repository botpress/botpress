import { Router } from 'express'

export * from './modules'
export * from './bots'

export interface CustomRouter {
  readonly router: Router
}
