import { inject, injectable } from 'inversify'

import { TYPES } from '../../misc/types'
import { SessionRepository } from '../../repositories/session-repository'

@injectable()
export class SessionService {
  constructor(@inject(TYPES.SessionRepository) private sessionRepository: SessionRepository) {}

  async getContextForSession(id: string): Promise<any> {
    const session = await this.sessionRepository.get(id)
    return session.context
  }

  async setContextForSession(id: string, context: any) {
    const session = await this.sessionRepository.get(id)
    session.context = context
    await this.sessionRepository.update(id, session)
  }

  async deleteSession(id: string, substates?: any) {
    return await this.sessionRepository.delete(id, substates)
  }

  async getSession(id: string) {
    return await this.sessionRepository.get(id)
  }

  async createSession(id: string, state: any) {
    return await this.sessionRepository.upsert(id, state)
  }
}
