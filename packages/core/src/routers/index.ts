import { Router } from 'express'

export * from './modules'
export * from './bots'
export * from './admin'
export * from './auth'

export interface CustomRouter {
  readonly router: Router
}
