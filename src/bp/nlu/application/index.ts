import { EntityRepository } from './repositories/entity-repo'
import { IntentRepository } from './repositories/intent-repo'
import { FileSystem } from './typings'

export const makeDefinitionsRepositories = (ghost: FileSystem) => {
  const entityRepo = new EntityRepository(ghost)
  const intentRepo = new IntentRepository(ghost, entityRepo)
  return { entityRepo, intentRepo }
}
