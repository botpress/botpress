import { inject, injectable } from 'inversify'

import { TYPES } from '../../misc/types'
import { DialogSession, SessionRepository } from '../../repositories/session-repository'

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
    await this.sessionRepository.update(session)
  }

  async deleteSession(id: string) {
    return await this.sessionRepository.delete(id)
  }

  async getSession(id: string): Promise<DialogSession> {
    const session = await this.sessionRepository.get(id)
    console.log(session)
    return session
  }

  async createSession(session) {
    return await this.sessionRepository.upsert(session)
  }
}
