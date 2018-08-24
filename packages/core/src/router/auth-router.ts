import AuthService from '../services/auth/auth-service'

import { BaseRouter } from './base-router'

export class AuthRouter extends BaseRouter {
  constructor(private authService: AuthService) {
    super()
  }

  setupRoutes() {
    const router = this.router
  }
}
