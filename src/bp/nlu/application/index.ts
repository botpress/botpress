import * as sdk from 'botpress/sdk'
import { GhostService } from 'core/services'
import AuthService from 'core/services/auth/auth-service'
import { WorkspaceService } from 'core/services/workspace-service'
import { NLURouter } from './api/router'
import { EntityRepository } from './repositories/entity-repo'
import { IntentRepository } from './repositories/intent-repo'

export const makeNLURouter = (
  logger: sdk.Logger,
  authService: AuthService,
  workspaceService: WorkspaceService,
  ghost: GhostService
) => {
  const entityRepo = new EntityRepository(ghost)
  const intentRepo = new IntentRepository(ghost, entityRepo)
  return new NLURouter(logger, authService, workspaceService, intentRepo, entityRepo)
}
